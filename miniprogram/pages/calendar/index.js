const { listRecords, buildDateSet, buildRecordsByDate } = require("../../utils/records");
const { formatLocalDate, addMonths, getMonthTitle, getMonthGrid } = require("../../utils/date");

Page({
  data: {
    monthCursor: null,
    monthTitle: "",
    grid: [],
    dateSet: {},
    recordsByDate: {},
    selectedDate: formatLocalDate(new Date()),
    dayRecords: []
  },

  onLoad() {
    const today = new Date();
    const cursor = new Date(today.getFullYear(), today.getMonth(), 1);
    this.setData({ monthCursor: cursor.getTime() });
    this.refreshAll();
  },

  onShow() {
    this.refreshAll();
  },

  refreshAll() {
    const records = listRecords();
    const dateSet = buildDateSet(records);
    const recordsByDate = buildRecordsByDate(records);

    const cursor = this.data.monthCursor ? new Date(this.data.monthCursor) : new Date();
    const monthTitle = getMonthTitle(cursor);
    const grid = getMonthGrid(cursor, 1);

    const selectedDate = this.data.selectedDate || formatLocalDate(new Date());
    const dayRecords = recordsByDate[selectedDate] || [];

    this.setData({
      monthTitle,
      grid,
      dateSet,
      recordsByDate,
      selectedDate,
      dayRecords
    });
  },

  onPrevMonth() {
    const cursor = this.data.monthCursor ? new Date(this.data.monthCursor) : new Date();
    const next = addMonths(cursor, -1);
    this.setData({ monthCursor: next.getTime() });
    this.refreshAll();
  },

  onNextMonth() {
    const cursor = this.data.monthCursor ? new Date(this.data.monthCursor) : new Date();
    const next = addMonths(cursor, 1);
    this.setData({ monthCursor: next.getTime() });
    this.refreshAll();
  },

  onSelectDay(e) {
    const ymd = e.currentTarget.dataset.ymd;
    if (!ymd) return;
    const dayRecords = this.data.recordsByDate[ymd] || [];
    this.setData({ selectedDate: ymd, dayRecords });
  },

  onNewWithDate() {
    const ymd = this.data.selectedDate || formatLocalDate(new Date());
    wx.navigateTo({ url: `/pages/recordForm/index?date=${encodeURIComponent(ymd)}` });
  },

  onTapDetail(e) {
    const { id } = e.currentTarget.dataset;
    if (!id) return;
    wx.navigateTo({ url: `/pages/recordDetail/index?id=${encodeURIComponent(id)}` });
  }
});

