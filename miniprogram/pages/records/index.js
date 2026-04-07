const { listRecords, createRecord } = require("../../utils/records");
const { formatLocalDate } = require("../../utils/date");

function ymdToTime(ymd) {
  const parts = (ymd || "").split("-");
  if (parts.length !== 3) return 0;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (!y || !m || !d) return 0;
  return new Date(y, m - 1, d).getTime();
}

function startOfThisMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}

function daysFromToday(delta) {
  const d = new Date();
  d.setDate(d.getDate() + delta);
  return formatLocalDate(d);
}

function sampleGym(i) {
  const gyms = [
    "岩点攀岩馆",
    "城市攀岩 Factory",
    "Boulder Lab",
    "极限攀岩馆",
    "ClimbPark",
    "小山攀岩",
    "岩馆·南山店",
    "室内抱石馆"
  ];
  return { provider: "manual", name: gyms[i % gyms.length] };
}

function sampleNote(i) {
  const notes = [
    "今天状态不错，热身后开始上强度。",
    "脚法需要更细，试了几次同线。",
    "做了核心训练，最后刷了两条老线。",
    "第一次来这家馆，线路风格很喜欢。",
    "手皮不太行，提前收工。"
  ];
  return notes[i % notes.length];
}

Page({
  data: {
    records: [],
    filtered: [],
    filterRange: "all", // all | 7d | 30d | month
    filterGymKey: "all", // all | amap:xxx | manual:xxx
    filterGymLabel: "全部场馆"
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const records = listRecords();
    this.setData({ records });
    this.applyFilters();
  },

  applyFilters() {
    const { records, filterRange, filterGymKey } = this.data;
    const now = Date.now();
    let minTime = 0;
    if (filterRange === "7d") minTime = now - 7 * 24 * 60 * 60 * 1000;
    if (filterRange === "30d") minTime = now - 30 * 24 * 60 * 60 * 1000;
    if (filterRange === "month") minTime = startOfThisMonth();

    const filtered = (records || []).filter((r) => {
      if (minTime) {
        const t = ymdToTime(r.date);
        if (!t || t < minTime) return false;
      }
      if (filterGymKey && filterGymKey !== "all") {
        const g = r.gym || {};
        const key = g.provider === "amap" && g.poiId ? `amap:${g.poiId}` : `manual:${g.name || ""}`;
        if (key !== filterGymKey) return false;
      }
      return true;
    });

    this.setData({ filtered });
  },

  onTapFilters() {
    wx.showActionSheet({
      itemList: ["全部", "最近 7 天", "最近 30 天", "本月"],
      success: (res) => {
        const idx = res.tapIndex;
        const nextRange = idx === 1 ? "7d" : idx === 2 ? "30d" : idx === 3 ? "month" : "all";
        this.setData({ filterRange: nextRange });
        this.applyFilters();
      }
    });
  },

  onTapGymFilter() {
    const map = new Map();
    (this.data.records || []).forEach((r) => {
      const g = r.gym || {};
      const label = g && g.name ? g.name : "未填写场馆";
      const key = g.provider === "amap" && g.poiId ? `amap:${g.poiId}` : `manual:${label}`;
      if (!map.has(key)) map.set(key, label);
    });
    const keys = ["all", ...Array.from(map.keys())];
    const labels = ["全部场馆", ...Array.from(map.values())];
    wx.showActionSheet({
      itemList: labels,
      success: (res) => {
        const k = keys[res.tapIndex] || "all";
        const l = labels[res.tapIndex] || "全部场馆";
        this.setData({ filterGymKey: k, filterGymLabel: l });
        this.applyFilters();
      }
    });
  },

  onTapNew() {
    wx.navigateTo({ url: "/pages/recordForm/index" });
  },

  onTapDetail(e) {
    const { id } = e.currentTarget.dataset;
    if (!id) return;
    wx.navigateTo({ url: `/pages/recordDetail/index?id=${encodeURIComponent(id)}` });
  },

  onTapFillSamples() {
    const existed = listRecords();
    if (existed.length > 0) {
      wx.showModal({
        title: "填充示例数据",
        content: "当前已有记录。继续会在现有基础上追加示例数据，是否继续？",
        success: (res) => {
          if (res.confirm) this._fillSamples();
        }
      });
      return;
    }
    this._fillSamples();
  },

  _fillSamples() {
    const deltas = [0, -1, -2, -5, -8, -12, -18, -25, -33];
    const count = Math.floor(Math.random() * 3) + 7; // 7-9
    for (let i = 0; i < count; i++) {
      createRecord({
        date: daysFromToday(deltas[i % deltas.length]),
        gym: sampleGym(i),
        note: sampleNote(i)
      });
    }
    wx.showToast({ title: "已填充", icon: "success" });
    this.refresh();
  }
});

