import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";

const app = express();

const PORT = parseInt(process.env.PORT || "8787", 10);
const AMAP_KEY = process.env.AMAP_KEY || "";

if (!AMAP_KEY) {
  // eslint-disable-next-line no-console
  console.warn("[warn] AMAP_KEY is empty. Set it in server/.env");
}

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: "draft-7",
    legacyHeaders: false
  })
);

app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

function badRequest(res, message) {
  res.status(400).json({ error: { message } });
}

function upstreamError(res, message) {
  res.status(502).json({ error: { message } });
}

function parseLocationStr(location) {
  if (!location || typeof location !== "string") return { lng: null, lat: null };
  const [lngStr, latStr] = location.split(",");
  const lng = Number(lngStr);
  const lat = Number(latStr);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return { lng: null, lat: null };
  return { lng, lat };
}

async function amapGet(path, params) {
  const url = new URL(`https://restapi.amap.com${path}`);
  Object.entries({ key: AMAP_KEY, ...params }).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    url.searchParams.set(k, String(v));
  });

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 8000);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  } finally {
    clearTimeout(t);
  }
}

// 输入提示（联想）
app.get("/api/poi/inputtips", async (req, res) => {
  const keywords = (req.query.keywords || "").toString().trim();
  const city = (req.query.city || "").toString().trim();
  if (!keywords || keywords.length < 2) return badRequest(res, "keywords too short");
  if (!AMAP_KEY) return upstreamError(res, "AMAP_KEY not configured");

  try {
    const data = await amapGet("/v3/assistant/inputtips", {
      keywords,
      city,
      citylimit: req.query.citylimit ? "true" : undefined
    });
    // 高德 status: "1" 表示成功
    if (data.status !== "1") return upstreamError(res, data.info || "amap failed");

    const tips = Array.isArray(data.tips)
      ? data.tips
          .filter((t) => t && t.name)
          .map((t) => ({
            name: t.name || "",
            district: t.district || "",
            address: t.address || "",
            location: t.location || "",
            id: t.id || ""
          }))
      : [];

    res.json({ tips });
  } catch (e) {
    upstreamError(res, "amap upstream error");
  }
});

// POI 搜索（可落库）
app.get("/api/poi/search", async (req, res) => {
  const keywords = (req.query.keywords || "").toString().trim();
  const city = (req.query.city || "").toString().trim();
  const page = Math.max(1, parseInt((req.query.page || "1").toString(), 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt((req.query.pageSize || "20").toString(), 10) || 20));

  if (!keywords || keywords.length < 2) return badRequest(res, "keywords too short");
  if (!AMAP_KEY) return upstreamError(res, "AMAP_KEY not configured");

  try {
    const data = await amapGet("/v3/place/text", {
      keywords,
      city,
      page,
      offset: pageSize,
      extensions: "all"
    });
    if (data.status !== "1") return upstreamError(res, data.info || "amap failed");

    const count = parseInt(data.count || "0", 10) || 0;
    const hasMore = page * pageSize < count;

    const pois = Array.isArray(data.pois)
      ? data.pois
          .filter((p) => p && p.id && p.name)
          .map((p) => {
            const { lng, lat } = parseLocationStr(p.location);
            return {
              poiId: p.id || "",
              name: p.name || "",
              address: p.address || "",
              location: { lng, lat },
              city: p.cityname || "",
              provider: "amap"
            };
          })
      : [];

    res.json({ pois, page, pageSize, hasMore });
  } catch (e) {
    upstreamError(res, "amap upstream error");
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`POI proxy listening on :${PORT}`);
});

