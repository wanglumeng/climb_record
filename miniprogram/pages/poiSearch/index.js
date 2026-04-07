const { inputtips, searchPois } = require("../../utils/poi");

let debounceTimer = null;

function agentLog(hypothesisId, location, message, data) {
  // #region agent log
  wx.request({
    url: "http://127.0.0.1:7931/ingest/162b5438-d37d-41c8-9088-6d5e337cd0b2",
    method: "POST",
    header: { "Content-Type": "application/json", "X-Debug-Session-Id": "39280e" },
    data: {
      sessionId: "39280e",
      runId: "pre-fix",
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now()
    },
    fail() {}
  });
  // #endregion
}

Page({
  data: {
    keywords: "",
    city: "",
    loading: false,
    error: "",
    tips: [],
    pois: [],
    page: 1,
    pageSize: 20,
    hasMore: false
  },

  onLoad(options) {
    const city = (options && options.city) || "";
    this.setData({ city });
    wx.setNavigationBarTitle({ title: "选择攀岩馆" });
    agentLog("H1", "pages/poiSearch/index.js:55", "poiSearch onLoad", { city });
  },

  onKeywordsInput(e) {
    const keywords = (e.detail && e.detail.value) || "";
    this.setData({ keywords, error: "" });
    agentLog("H2", "pages/poiSearch/index.js:63", "keywords input", { len: keywords.length });

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      this._search(true);
    }, 300);
  },

  onTapSearch() {
    agentLog("H10", "pages/poiSearch/index.js:78", "tap search button", {});
    this._search(true);
  },

  onReachBottom() {
    if (!this.data.hasMore || this.data.loading) return;
    this._search(false);
  },

  async _search(reset) {
    const keywords = (this.data.keywords || "").trim();
    if (!keywords || keywords.length < 2) {
      this.setData({ tips: [], pois: [], error: keywords ? "至少输入 2 个字符" : "" });
      agentLog("H2", "pages/poiSearch/index.js:88", "search skipped (too short)", { keywords });
      return;
    }

    const page = reset ? 1 : (this.data.page || 1) + 1;

    this.setData({
      loading: true,
      error: reset ? "" : this.data.error,
      page: reset ? 1 : this.data.page
    });

    try {
      // tips 仅用于联想展示，失败不影响主流程
      if (reset) {
        try {
          const tipRes = await inputtips({ keywords, city: this.data.city });
          this.setData({ tips: (tipRes && tipRes.tips) || [] });
        } catch (e) {
          this.setData({ tips: [] });
        }
      }

      const res = await searchPois({ keywords, city: this.data.city, page, pageSize: this.data.pageSize });
      const incoming = (res && res.pois) || [];
      const pois = reset ? incoming : (this.data.pois || []).concat(incoming);

      this.setData({
        pois,
        page: res.page || page,
        hasMore: !!res.hasMore,
        loading: false
      });
      agentLog("H3", "pages/poiSearch/index.js:125", "search success", { reset, page, incoming: incoming.length, total: pois.length, hasMore: !!res.hasMore });
    } catch (e) {
      const status = e && e.statusCode;
      let msg = "搜索失败，请稍后再试";
      if (status === 429) msg = "请求太频繁，请稍后再试";
      if (status === 400) msg = "关键词过短或参数错误";
      this.setData({ loading: false, error: msg });
      agentLog("H3", "pages/poiSearch/index.js:134", "search failed", { status, msg });
    }
  },

  onTapPoi(e) {
    const idx = e.currentTarget.dataset.idx;
    const poi = (this.data.pois || [])[idx];
    agentLog("H4", "pages/poiSearch/index.js:141", "tap poi", { idx, hasPoi: !!poi });
    if (!poi) return;

    const gym = {
      poiId: poi.poiId || "",
      name: poi.name || "",
      address: poi.address || "",
      location: {
        lat: poi.location ? poi.location.lat : null,
        lng: poi.location ? poi.location.lng : null
      },
      city: poi.city || "",
      provider: "amap"
    };

    const channel = this.getOpenerEventChannel && this.getOpenerEventChannel();
    agentLog("H5", "pages/poiSearch/index.js:160", "emit poiSelected", { hasChannel: !!channel, hasEmit: !!(channel && channel.emit), gymName: gym.name, poiId: gym.poiId });
    if (channel && channel.emit) channel.emit("poiSelected", { gym });
    wx.navigateBack({ delta: 1 });
  },

  onPoiTouchStart(e) {
    const idx = e.currentTarget.dataset.idx;
    agentLog("H8", "pages/poiSearch/index.js:169", "poi touchstart", { idx });
  },

  onResultContainerTap() {
    agentLog("H9", "pages/poiSearch/index.js:174", "result container tap", {});
  },

  onTapManual() {
    agentLog("H11", "pages/poiSearch/index.js:178", "tap manual button", { keywordsLen: ((this.data.keywords || "").trim()).length });
    const keywords = (this.data.keywords || "").trim();
    if (!keywords) {
      wx.showToast({ title: "请先输入场馆名", icon: "none" });
      return;
    }
    const gym = { poiId: "", name: keywords, address: "", location: { lat: null, lng: null }, city: "", provider: "manual" };
    const channel = this.getOpenerEventChannel && this.getOpenerEventChannel();
    if (channel && channel.emit) channel.emit("poiSelected", { gym });
    wx.navigateBack({ delta: 1 });
  }
});

