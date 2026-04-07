const { formatLocalDate } = require("../../utils/date");
const { getRecordById, createRecord, updateRecord, normalizeManualGymName } = require("../../utils/records");
const { loadRecentGyms } = require("../../utils/storage");

function safeNavigateBackOrSwitchTab() {
  const pages = getCurrentPages();
  if (pages && pages.length > 1) {
    wx.navigateBack({ delta: 1 });
    return;
  }
  wx.switchTab({ url: "/pages/records/index" });
}

Page({
  data: {
    id: "",
    date: formatLocalDate(new Date()),
    gym: null,
    gymName: "",
    note: "",
    saving: false,
    recentGyms: []
  },

  onLoad(options) {
    const id = (options && options.id) || "";
    const presetDate = (options && options.date) || "";

    this.setData({ recentGyms: loadRecentGyms() });

    if (id) {
      const r = getRecordById(id);
      if (!r) {
        wx.showToast({ title: "记录不存在", icon: "none" });
        setTimeout(() => safeNavigateBackOrSwitchTab(), 300);
        return;
      }
      this.setData({
        id,
        date: r.date,
        gym: r.gym || null,
        gymName: (r.gym && r.gym.name) || "",
        note: r.note || ""
      });
      wx.setNavigationBarTitle({ title: "编辑记录" });
      return;
    }

    const date = presetDate || formatLocalDate(new Date());
    this.setData({ date });
    wx.setNavigationBarTitle({ title: "新建记录" });
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value });
  },

  onGymNameInput(e) {
    this.setData({ gymName: e.detail.value, gym: null });
  },

  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },

  onCancel() {
    safeNavigateBackOrSwitchTab();
  },

  onTapChoosePoi() {
    wx.navigateTo({
      url: "/pages/poiSearch/index",
      events: {
        poiSelected: (payload) => {
          if (!payload || !payload.gym) return;
          this.setData({ gym: payload.gym, gymName: payload.gym.name || "" });
        }
      }
    });
  },

  onTapRecentGym(e) {
    const idx = e.currentTarget.dataset.idx;
    const g = (this.data.recentGyms || [])[idx];
    if (!g) return;
    this.setData({ gym: g, gymName: g.name || "" });
  },

  onSave() {
    if (this.data.saving) return;
    const date = this.data.date;
    const gymName = normalizeManualGymName(this.data.gymName);
    const note = (this.data.note || "").trim();

    if (!date) {
      wx.showToast({ title: "请选择日期", icon: "none" });
      return;
    }
    if (!gymName) {
      wx.showToast({ title: "请填写场馆名", icon: "none" });
      return;
    }

    this.setData({ saving: true });

    try {
      const gym =
        this.data.gym && this.data.gym.name
          ? this.data.gym
          : { provider: "manual", poiId: "", name: gymName, address: "", location: { lat: null, lng: null }, city: "" };

      if (this.data.id) {
        const next = updateRecord(this.data.id, {
          date,
          gym,
          note
        });
        if (!next) throw new Error("update failed");
      } else {
        createRecord({
          date,
          gym,
          note
        });
      }
      wx.showToast({ title: "已保存", icon: "success" });
      setTimeout(() => safeNavigateBackOrSwitchTab(), 350);
    } catch (e) {
      wx.showToast({ title: "保存失败", icon: "none" });
      this.setData({ saving: false });
    }
  }
});

