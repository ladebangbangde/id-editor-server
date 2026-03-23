# AI ID Photo Backend

## 安装
```bash
cd server
npm install
```

## 初始化数据库
1. 在仓库根目录创建 `.env.runtime`（参考 `../.env.example`）
2. `WECHAT_APPID` / `WECHAT_SECRET` 必须填写真实值
3. `JWT_SECRET` 不需要写入 env，server 首次启动会自动写入数据库 `system_configs`
4. 执行：
```bash
mysql -uroot -p < sql/init.sql
```

## 启动服务
```bash
cp ../.env.example ../.env.runtime
cd ..
# 编辑 .env.runtime 后再启动
cd server
npm run dev
```
或
```bash
cd server
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

## Docker 共享上传目录约定
- 容器内上传根目录建议固定为 `UPLOAD_DIR=/app/uploads`。
- `id-editor-server` 与 `id-editor-tool` 需要通过 `-v <host_upload_dir>:/app/uploads` 挂载同一个共享卷。
- server 保存原图到 `/app/uploads/original/...`，对前端继续暴露 `/uploads/original/...` 静态 URL。
- server 调 tool 时传递的是共享绝对路径，通过 `TOOL_SHARED_UPLOAD_ROOT=/app/uploads` 生成，例如 `/app/uploads/original/xxx.png`，不要再传相对路径 `uploads/original/xxx.png`。
