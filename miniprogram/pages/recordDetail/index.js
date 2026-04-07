const { getRecordById, deleteRecord } = require("../../utils/records");

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
    record: null
  },

  onLoad(options) {
    const id = (options && options.id) || "";
    this.setData({ id });
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const r = this.data.id ? getRecordById(this.data.id) : null;
    this.setData({ record: r || null });
  },

  onBack() {
    safeNavigateBackOrSwitchTab();
  },

  onEdit() {
    if (!this.data.id) return;
    wx.navigateTo({ url: `/pages/recordForm/index?id=${encodeURIComponent(this.data.id)}` });
  },

  onDelete() {
    if (!this.data.id) return;
    wx.showModal({
      title: "删除记录",
      content: "确定要删除这条记录吗？此操作不可恢复。",
      confirmText: "删除",
      confirmColor: "#c5221f",
      success: (res) => {
        if (!res.confirm) return;
        const ok = deleteRecord(this.data.id);
        if (!ok) {
          wx.showToast({ title: "删除失败", icon: "none" });
          return;
        }
        wx.showToast({ title: "已删除", icon: "success" });
        setTimeout(() => safeNavigateBackOrSwitchTab(), 350);
      }
    });
  }
});

