# AI ID Photo Backend

## 安装
```bash
cd server
npm install
```

## 初始化数据库
1. 创建 `.env`（参考 `.env.example`）
2. 执行：
```bash
mysql -uroot -p < sql/init.sql
```

## 启动服务
```bash
npm run dev
```
或
```bash
npm start
```

## 接口测试
- 先上传图片：`POST /api/upload`（form-data: file）
- 再生成：`POST /api/images/generate`
- 订单：`POST /api/orders` + `POST /api/orders/:orderId/mock-pay`
- 下载：`GET /api/download/:resultId/{preview|hd|print}`

## 说明
- 当前用户与支付为 mock 模式，可替换微信登录与微信支付。
- AI 检测/抠图/质检为 mock，裁剪/背景/排版由 sharp 可运行实现。
- 文件默认存储本地 uploads，后续可改 OSS/COS 临时签名下载。

## 健康检查与调用（容器映射到宿主机 30000 时）
如果你把容器 `3000` 端口映射到了宿主机 `30000`（例如 `-p 30000:3000`），可直接在宿主机执行：

```bash
curl -i http://127.0.0.1:30000/health
```

预期返回 `200` 和 JSON：

```json
{"status":"ok"}
```

你也可以检查主要 API：

```bash
curl -i http://127.0.0.1:30000/api/scenes
```
