App({
  onLaunch() {
    // 触发一次迁移/初始化
    const { migrateIfNeeded } = require("./utils/storage");
    migrateIfNeeded();
  }
});

