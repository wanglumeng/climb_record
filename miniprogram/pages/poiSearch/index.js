const { inputtips, searchPois } = require("../../utils/poi");

let debounceTimer = null;

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
  },

  onKeywordsInput(e) {
    const keywords = (e.detail && e.detail.value) || "";
    this.setData({ keywords, error: "" });

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      this._search(true);
    }, 300);
  },

  onTapSearch() {
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
    } catch (e) {
      const status = e && e.statusCode;
      let msg = "搜索失败，请稍后再试";
      if (status === 429) msg = "请求太频繁，请稍后再试";
      if (status === 400) msg = "关键词过短或参数错误";
      this.setData({ loading: false, error: msg });
    }
  },

  onTapPoi(e) {
    const idx = e.currentTarget.dataset.idx;
    const poi = (this.data.pois || [])[idx];
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
    if (channel && channel.emit) channel.emit("poiSelected", { gym });
    wx.navigateBack({ delta: 1 });
  },

  onTapManual() {
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

