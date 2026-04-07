const KEY_SCHEMA_VERSION = "schemaVersion";
const KEY_RECORDS = "records";
const KEY_RECENT_GYMS = "recentGyms";

const CURRENT_SCHEMA_VERSION = 1;

function getStorage(key, defaultValue) {
  try {
    const v = wx.getStorageSync(key);
    return v === "" || v === undefined ? defaultValue : v;
  } catch (e) {
    return defaultValue;
  }
}

function setStorage(key, value) {
  wx.setStorageSync(key, value);
}

function migrateIfNeeded() {
  const schemaVersion = getStorage(KEY_SCHEMA_VERSION, 0);
  if (schemaVersion >= CURRENT_SCHEMA_VERSION) return;

  // v0 -> v1: 初始化 records / recentGyms，并补齐字段默认值
  const records = getStorage(KEY_RECORDS, []);
  const migratedRecords = Array.isArray(records)
    ? records.map((r) => ({
        deletedAt: null,
        ...r,
        gym: {
          poiId: "",
          name: "",
          address: "",
          location: { lat: null, lng: null },
          city: "",
          provider: "manual",
          ...(r && r.gym ? r.gym : {})
        }
      }))
    : [];

  setStorage(KEY_RECORDS, migratedRecords);

  const recentGyms = getStorage(KEY_RECENT_GYMS, []);
  setStorage(KEY_RECENT_GYMS, Array.isArray(recentGyms) ? recentGyms : []);

  setStorage(KEY_SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);
}

function loadRecords() {
  migrateIfNeeded();
  return getStorage(KEY_RECORDS, []);
}

function saveRecords(records) {
  setStorage(KEY_RECORDS, records);
}

function loadRecentGyms() {
  migrateIfNeeded();
  return getStorage(KEY_RECENT_GYMS, []);
}

function saveRecentGyms(gyms) {
  setStorage(KEY_RECENT_GYMS, gyms);
}

module.exports = {
  KEY_SCHEMA_VERSION,
  KEY_RECORDS,
  KEY_RECENT_GYMS,
  CURRENT_SCHEMA_VERSION,
  migrateIfNeeded,
  loadRecords,
  saveRecords,
  loadRecentGyms,
  saveRecentGyms
};

