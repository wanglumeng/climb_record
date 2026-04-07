## 开发说明（本地联调）

### 小程序端运行
1. 打开微信开发者工具
2. 导入项目：选择仓库根目录（推荐，已包含 `project.config.json`）
3. 如需本地联调请求后端：勾选「不校验合法域名」（上线前请配置合法域名）

### 后端代理运行（高德 POI）
前置：Node.js >= 18

```bash
cd server
npm i
cp .env.example .env
# 编辑 .env，填入 AMAP_KEY
npm run dev
```

健康检查：`GET /healthz`

### 环境变量
- `PORT`：默认 `8787`
- `AMAP_KEY`：高德 Web 服务 Key（只放服务端，不要放到小程序端）

见 `server/.env.example`。

### 常用验证路径
- **记录页**：新建 / 编辑 / 删除 / 填充示例数据
- **日历页**：有记录日期高亮，点选显示当天记录列表
- **新建页**：点击「地图模糊搜索」进入 POI 搜索页并选择回填

