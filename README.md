# AI 证件照项目（Backend Repo）

这个仓库现在**以后端为主**（`server/`），用于给微信小程序 / Web UI 提供 API 能力。

你提到的独立 UI 仓库：
- `id-editor-ui`: https://github.com/ladebangbangde/id-editor-ui

## 是否还需要 `miniapp` 目录？

结论：**不是必须**。推荐按下面策略：

- 如果你已经决定前后端分仓（后端在本仓库，前端在 `id-editor-ui`），可以删除本仓库里的 `miniapp/`，减少维护成本。
- 如果你还希望保留“本地联调样例”或“备用 Demo”，可以暂时保留 `miniapp/`，但建议标注为 `legacy` 或 `example`，避免与主 UI 仓库重复维护。

## 当前建议的仓库职责

- 本仓库（`id-editor`）：
  - 后端 API
  - 数据库模型与 SQL
  - AI 图像处理流水线（mock + sharp）
  - 订单/支付状态/下载权限
- UI 仓库（`id-editor-ui`）：
  - 页面与交互
  - 场景选择、上传、下单、历史展示
  - 与后端 API 对接

## 后端启动（server）

### 1) 配置环境变量

```bash
cp .env.example .env.runtime
# 编辑 .env.runtime，填入真实配置
# 注意：JWT_SECRET 不需要手工填写，server 首次启动会自动生成并写入数据库 system_configs
```

### 2) 安装依赖

```bash
cd server
npm install
```

### 3) 初始化数据库

```bash
mysql -u root -p < sql/init.sql
```

### 4) 启动服务

```bash
cd server
npm run dev
```

默认地址：`http://localhost:3000`

## Dockerfile + docker run（生产推荐）

- Dockerfile 不保存任何真实配置。
- 真实配置统一写在服务器上的 `.env.runtime`。
- `WECHAT_APPID` / `WECHAT_SECRET` 必须通过 `.env.runtime` 提供。
- server 首次启动后会自动把 `jwt_secret` 初始化到数据库 `system_configs` 表，后续签发和校验统一读取数据库中的同一份密钥。

### 构建镜像

```bash
docker build -t id-editor-server:latest .
```

### 启动容器

```bash
docker run -d \
  --name id-editor-server \
  -p 30000:3000 \
  --env-file .env.runtime \
  -v $(pwd)/data/uploads:/app/uploads \
  id-editor-server:latest
```

## docker compose（未来可直接复用同一份配置）

仓库中的 `docker-compose.yml` 已改为读取根目录 `.env.runtime`。创建好该文件后，可直接执行：

```bash
docker compose up -d --build
```

## 核心 API（v1）

- `GET /api/scenes`
- `GET /api/scenes/:sceneKey`
- `GET /api/auth/me`
- `POST /api/upload`
- `POST /api/images/generate`
- `GET /api/tasks/:taskId`
- `GET /api/images/history`
- `GET /api/images/:imageId/detail`
- `POST /api/orders`
- `GET /api/orders/:orderId`
- `POST /api/orders/:orderId/mock-pay`
- `GET /api/download/:resultId/preview`
- `GET /api/download/:resultId/hd`
- `GET /api/download/:resultId/print`
- `GET /api/admin/stats`
