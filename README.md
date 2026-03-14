# 微信小程序 AI 证件照制作项目（MVP）

这是一个可本地运行的微信小程序 + Node.js 后端的完整 MVP 骨架，用于上传自拍并生成证件照预览图。

## 目录结构

```text
.
├── miniapp/                         # 微信小程序前端
│   ├── app.js
│   ├── app.json
│   ├── app.wxss
│   ├── project.config.json
│   ├── sitemap.json
│   ├── utils/
│   │   └── request.js
│   └── pages/
│       ├── home/
│       │   ├── index.js
│       │   ├── index.json
│       │   ├── index.wxml
│       │   └── index.wxss
│       ├── preview/
│       │   ├── index.js
│       │   ├── index.json
│       │   ├── index.wxml
│       │   └── index.wxss
│       ├── order/
│       │   ├── index.js
│       │   ├── index.json
│       │   ├── index.wxml
│       │   └── index.wxss
│       └── profile/
│           ├── index.js
│           ├── index.json
│           ├── index.wxml
│           └── index.wxss
├── server/                          # Node.js + Express 后端
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/
│   │   │   ├── env.js
│   │   │   └── logger.js
│   │   ├── constants/
│   │   │   └── idPhotoSpecs.js
│   │   ├── db/
│   │   │   ├── knex.js
│   │   │   └── migrations/
│   │   │       └── 202603130001_init_tables.js
│   │   ├── middlewares/
│   │   │   ├── errorHandler.js
│   │   │   └── notFoundHandler.js
│   │   ├── modules/
│   │   │   └── imageProcessor.js
│   │   ├── routes/
│   │   │   ├── index.js
│   │   │   ├── upload.routes.js
│   │   │   ├── image.routes.js
│   │   │   └── order.routes.js
│   │   ├── services/
│   │   │   ├── image.service.js
│   │   │   └── order.service.js
│   │   └── utils/
│   │       ├── apiResponse.js
│   │       └── asyncHandler.js
│   ├── storage/
│   │   ├── uploads/
│   │   └── processed/
│   ├── scripts/
│   │   └── init.sql
│   ├── .env.example
│   ├── knexfile.js
│   └── package.json
└── .gitignore
```

## 1. 后端运行（server）

### 环境准备

- Node.js 18+
- MySQL 8+

### 配置

```bash
cd server
cp .env.example .env
```

按需修改 `.env` 中的数据库连接。

### 安装依赖

```bash
npm install
```

### 初始化数据库

你可以二选一：

1) 使用 SQL 脚本：

```bash
mysql -u root -p < scripts/init.sql
```

2) 使用 Knex Migration：

```bash
npm run migrate
```

### 启动服务

```bash
npm run dev
```

服务默认地址：`http://localhost:3000`
静态文件访问前缀：`/static`

## 2. 小程序运行（miniapp）

1. 打开微信开发者工具。
2. 导入 `miniapp` 目录。
3. 在 `miniapp/utils/request.js` 中确认 `BASE_URL`（默认 `http://127.0.0.1:3000`）。
4. 在开发者工具中勾选“不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书”。
5. 运行并测试上传、生成预览、创建订单流程。

## 3. API 概览

- `POST /api/upload` 上传原图
- `POST /api/images/:imageId/generate` 根据背景色+尺寸生成预览
- `GET /api/images/:imageId` 查询图片记录
- `POST /api/orders` 创建订单（支付 mock）
- `GET /api/orders/:orderId` 查询订单

统一返回格式：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

## 4. 后续扩展建议

- 将 `modules/imageProcessor.js` 中 mock 逻辑替换为真实 AI 分割服务。
- 接入微信支付：在 `order.routes.js` 添加预下单/回调验签。
- 增加用户鉴权（微信登录态 + JWT）。
- 增加 CDN + 对象存储（COS/OSS/S3）管理图片。
