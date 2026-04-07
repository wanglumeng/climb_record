const { loadRecords, saveRecords, loadRecentGyms, saveRecentGyms } = require("./storage");
const { uuidv4 } = require("./uuid");

function normalizeManualGymName(name) {
  return (name || "")
    .trim()
    .replace(/\s+/g, " ")
    // 全角空格
    .replace(/\u3000/g, " ");
}

function recordSortDesc(a, b) {
  if (a.date !== b.date) return a.date > b.date ? -1 : 1;
  return (b.createdAt || 0) - (a.createdAt || 0);
}

function listRecords({ includeDeleted = false } = {}) {
  const all = loadRecords();
  const filtered = includeDeleted ? all : all.filter((r) => !r.deletedAt);
  return filtered.slice().sort(recordSortDesc);
}

function getRecordById(id) {
  return loadRecords().find((r) => r.id === id) || null;
}

function upsertRecentGym(gym) {
  if (!gym || !gym.name) return;
  const key = gym.provider === "amap" && gym.poiId ? `amap:${gym.poiId}` : `manual:${normalizeManualGymName(gym.name)}`;
  const prev = loadRecentGyms();
  const next = [{ ...gym, _key: key }, ...prev.filter((g) => (g._key || "") !== key)];
  saveRecentGyms(next.slice(0, 10));
}

function createRecord({ date, gym, note }) {
  const now = Date.now();
  const r = {
    id: uuidv4(),
    date,
    gym,
    note: note || "",
    createdAt: now,
    updatedAt: now,
    deletedAt: null
  };
  const all = loadRecords();
  all.push(r);
  saveRecords(all);
  upsertRecentGym(gym);
  return r;
}

function updateRecord(id, patch) {
  const all = loadRecords();
  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  const now = Date.now();
  const next = { ...all[idx], ...patch, updatedAt: now };
  all[idx] = next;
  saveRecords(all);
  if (patch.gym) upsertRecentGym(patch.gym);
  return next;
}

function deleteRecord(id) {
  const all = loadRecords();
  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) return false;
  all.splice(idx, 1);
  saveRecords(all);
  return true;
}

function buildDateSet(records) {
  const map = {};
  records.forEach((r) => {
    if (r.deletedAt) return;
    map[r.date] = (map[r.date] || 0) + 1;
  });
  return map;
}

function buildRecordsByDate(records) {
  const map = {};
  records.forEach((r) => {
    if (r.deletedAt) return;
    if (!map[r.date]) map[r.date] = [];
    map[r.date].push(r);
  });
  Object.keys(map).forEach((k) => map[k].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
  return map;
}

module.exports = {
  normalizeManualGymName,
  listRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
  buildDateSet,
  buildRecordsByDate
};

