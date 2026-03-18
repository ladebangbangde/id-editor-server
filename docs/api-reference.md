# id-editor Server API 接口文档

> 本文档基于当前仓库代码（`server/src`）整理，适用于默认配置：`API_PREFIX=/api`、服务端口 `3000`。

## 1. 通用说明

- **基础地址（示例）**：`http://127.0.0.1:30000`
- **API 前缀**：`/api`
- **响应结构**：
  - 成功：`{ "success": true, "code": 0, "message": "OK|ok", "data": ... }`
  - 失败：`{ "success": false, "code": 400|404|500, "message": "错误信息", "data": ... }`

## 2. 认证与权限

- 所有 `/api/*` 默认走 `auth` 中间件，当前版本使用 mock 用户自动注入 `req.user`。
- `/api/admin/*` 额外要求请求头 `x-admin-token`（当前仅检查存在性）。

## 3. 首页模块

### GET `/api/home/config`
- **用途**：获取首页主卡片和快捷入口配置。
- **返回字段**：`mainCards`、`quickEntries`
- **配置方式**：当前在 `home.service` 中以内置常量维护，便于后续改为配置表。

## 4. 规格模板模块

### GET `/api/spec/categories`
- **用途**：获取首页规格分类 tab。
- **排序**：`sort ASC, id ASC`
- **返回字段**：数组项包含 `key`、`name`、`sort`

### GET `/api/spec/list?category=hot&page=1&pageSize=20`
- **用途**：分页查询规格模板列表。
- **查询参数**：
  - `category`：可选，分类 key；为空时查询全部已启用模板。
  - `page`：可选，默认 `1`
  - `pageSize`：可选，默认 `20`
- **排序**：`is_hot DESC, sort ASC, id ASC`
- **返回字段**：`list`、`total`、`page`、`pageSize`

### GET `/api/spec/detail/:id`
- **用途**：查询单个规格模板详情。
- **路径参数**：`id`，例如 `size_001`

## 5. 其他既有模块

### GET `/api/scenes`
- **用途**：查询已启用场景模板列表

### GET `/api/scenes/:sceneKey`
- **用途**：按场景 key 查询单个模板详情

### GET `/api/auth/me`
- **用途**：获取当前用户信息（mock 用户）

### POST `/api/upload`
- **用途**：上传原始图片并创建图片记录

### POST `/api/images/generate`
- **用途**：执行证件照生成任务，返回任务与结果信息

### GET `/api/tasks/:taskId`
- **用途**：查询任务状态，前端轮询任务进度使用

### GET `/api/images/history?page=1&pageSize=10`
- **用途**：分页查询当前用户历史图片及结果

### GET `/api/images/:imageId/detail`
- **用途**：查询单张图片详情（包含任务与结果）

### POST `/api/orders`
- **用途**：创建订单

### GET `/api/orders/:orderId`
- **用途**：查询当前用户订单详情

### POST `/api/orders/:orderId/mock-pay`
- **用途**：模拟支付成功

### GET `/api/download/:resultId/preview`
- **用途**：获取预览图下载地址

### GET `/api/download/:resultId/hd`
- **用途**：获取高清图下载地址

### GET `/api/download/:resultId/print`
- **用途**：获取排版图下载地址

### GET `/api/admin/stats`
- **用途**：获取后台统计
