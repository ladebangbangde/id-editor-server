# id-editor Server API 接口文档

> 本文档基于当前仓库代码（`server/src`）整理，适用于默认配置：`API_PREFIX=/api`、服务端口 `3000`。

## 1. 通用说明

- **基础地址（示例）**：`http://127.0.0.1:30000`（当容器映射 `30000:3000`）
- **API 前缀**：`/api`
- **响应结构**：
  - 成功：`{ "success": true, "message": "OK", "data": ... }`
  - 失败：`{ "success": false, "message": "错误信息", "data": ... }`

## 2. 认证与权限

- 所有 `/api/*` 默认走 `auth` 中间件，当前版本使用 mock 用户自动注入 `req.user`。
- `/api/admin/*` 额外要求请求头 `x-admin-token`（当前仅检查存在性）。

---

## 3. 健康检查

### GET `/health`
- **用途**：服务存活探针
- **鉴权**：否
- **返回示例**：

```json
{
  "status": "ok"
}
```

---

## 4. Auth 模块

### GET `/api/auth/me`
- **用途**：获取当前用户信息（mock 用户）
- **鉴权**：是（自动 mock）

### POST `/api/auth/admin/login`
- **用途**：管理员登录（mock）
- **返回示例**：

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "token": "mock-admin-token"
  }
}
```

---

## 5. 场景模板模块

### GET `/api/scenes`
- **用途**：查询已启用场景模板列表
- **排序**：按 `sort_order ASC`

### GET `/api/scenes/:sceneKey`
- **用途**：按场景 key 查询单个模板详情
- **路径参数**：`sceneKey`（如 `passport`、`one_inch`）

---

## 6. 上传模块

### POST `/api/upload`
- **用途**：上传原始图片并创建图片记录
- **Content-Type**：`multipart/form-data`
- **表单字段**：`file`
- **文件限制**：仅 `jpg/jpeg/png`，大小受 `MAX_FILE_SIZE` 控制
- **返回字段**：`imageId`、`originalUrl`、`imageMeta`

`curl` 示例：

```bash
curl -X POST 'http://127.0.0.1:30000/api/upload' \
  -F 'file=@/path/to/test.jpg'
```

---

## 7. 图像生成与查询模块

### POST `/api/images/generate`
- **用途**：执行证件照生成任务，返回任务与结果信息
- **请求体常用字段**：
  - `imageId`：上传图片 ID（必填）
  - `sourceType`：`scene` 或 `custom`
  - `sceneKey`：当 `sourceType=scene` 时使用
  - `customWidthMm` / `customHeightMm`：当 `sourceType=custom` 时使用
  - `backgroundColor`：背景色（可选，默认 `white`）
  - `beautyEnabled`：是否美颜（可选）
  - `printLayoutType`：是否生成排版图（可选）
- **返回字段**：`taskId`、`resultId`、`previewUrl`、`status`

### GET `/api/images/history?page=1&pageSize=10`
- **用途**：分页查询当前用户历史图片及结果
- **查询参数**：`page`、`pageSize`
- **返回字段**：`list`、`total`、`page`、`pageSize`

### GET `/api/images/:imageId/detail`
- **用途**：查询单张图片详情（包含任务与结果）

---

## 8. 任务模块

### GET `/api/tasks/:taskId`
- **用途**：查询任务状态，前端轮询任务进度使用

---

## 9. 订单与支付模块

### POST `/api/orders`
- **用途**：创建订单
- **请求体字段**：`imageId`、`resultId`、`orderType`
- **orderType 价格规则**：
  - `hd` -> 9.9
  - `print` -> 14.9
  - `package` -> 19.9

### GET `/api/orders/:orderId`
- **用途**：查询当前用户订单详情

### POST `/api/orders/:orderId/mock-pay`
- **用途**：模拟支付成功
- **效果**：
  - 订单状态置为 `paid`
  - 写入支付记录
  - 开通对应下载权限（高清/排版）

---

## 10. 下载模块

### GET `/api/download/:resultId/preview`
- **用途**：获取预览图下载地址
- **权限**：通常不需要付费

### GET `/api/download/:resultId/hd`
- **用途**：获取高清图下载地址
- **权限**：需要已支付且有有效 paid 订单
- **失败**：无权限时返回 403

### GET `/api/download/:resultId/print`
- **用途**：获取排版图下载地址
- **权限**：需要已支付且有有效 paid 订单
- **失败**：无权限时返回 403

---

## 11. 管理端模块

### GET `/api/admin/stats`
- **用途**：获取后台统计（用户数、图片数、任务成功数、订单统计、热门场景）
- **请求头**：`x-admin-token: <any-non-empty-value>`

`curl` 示例：

```bash
curl -H 'x-admin-token: demo-token' \
  'http://127.0.0.1:30000/api/admin/stats'
```

---

## 12. 最小联调流程（建议）

1. `GET /health`（确认服务存活）
2. `POST /api/upload`（拿到 `imageId`）
3. `POST /api/images/generate`（拿到 `taskId` / `resultId`）
4. `GET /api/tasks/:taskId`（轮询到成功）
5. `POST /api/orders`（按需创建下载订单）
6. `POST /api/orders/:orderId/mock-pay`（模拟支付）
7. `GET /api/download/:resultId/{preview|hd|print}`（下载）
