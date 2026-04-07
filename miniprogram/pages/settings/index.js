const { KEY_RECORDS, KEY_SCHEMA_VERSION, KEY_RECENT_GYMS, CURRENT_SCHEMA_VERSION } = require("../../utils/storage");
const { listRecords } = require("../../utils/records");

Page({
  data: {
    recordCount: 0
  },

  onShow() {
    this.setData({ recordCount: listRecords().length });
  },

  onTapExportJson() {
    const payload = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      exportedAt: Date.now(),
      records: wx.getStorageSync(KEY_RECORDS) || []
    };
    const json = JSON.stringify(payload, null, 2);
    wx.setClipboardData({
      data: json,
      success: () => {
        wx.showToast({ title: "已复制到剪贴板", icon: "success" });
      }
    });
  },

  onTapClearAll() {
    wx.showModal({
      title: "清空本地数据",
      content: "将删除所有攀岩记录与最近场馆。此操作不可恢复，是否继续？",
      confirmText: "清空",
      confirmColor: "#c5221f",
      success: (res) => {
        if (!res.confirm) return;
        wx.removeStorageSync(KEY_RECORDS);
        wx.removeStorageSync(KEY_RECENT_GYMS);
        wx.setStorageSync(KEY_SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);
        this.setData({ recordCount: 0 });
        wx.showToast({ title: "已清空", icon: "success" });
      }
    });
  }
});

