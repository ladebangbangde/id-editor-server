# id-editor Server API 最新接口文档

> 本文档基于当前仓库代码实时整理，覆盖 `server/src/app.js` 中已注册的全部对外接口，适合作为前端、自动化脚本、联调工具与下游 Python 图像处理项目的上游参考。

## 1. 文档范围

- 服务端框架：Express
- 默认 API 前缀：`/api`
- 默认端口：`3000`
- 健康检查：`GET /health`
- 静态文件前缀：`/uploads`

如果未显式修改环境变量，则默认基础地址可写为：

- 本地：`http://127.0.0.1:3000`
- 完整 API 基址：`http://127.0.0.1:3000/api`

---

## 2. 通用约定

### 2.1 统一成功响应

所有控制器当前都通过 `success()` 返回成功结果：

```json
{
  "success": true,
  "code": 0,
  "message": "OK",
  "data": {}
}
```

说明：

- `success` 固定为 `true`
- `code` 固定为 `0`
- `message` 常见为 `OK` 或 `ok`，个别接口会返回自定义文案
- 业务数据放在 `data`

### 2.2 统一失败响应

失败响应由错误中间件与 `fail()` 输出，当前约定结构为：

```json
{
  "success": false,
  "code": 400,
  "message": "Error message",
  "data": null
}
```

说明：

- `code` 当前一般与 HTTP 状态码一致
- 常见状态码：`400`、`401`、`403`、`404`、`500`

### 2.3 鉴权现状

当前版本的 `/api/*` 路由统一经过 mock 鉴权中间件：

- 不校验登录态 token
- 服务端会自动查找或创建一个 mock 用户
- 该用户来自环境变量：
  - `MOCK_USER_OPENID`，默认 `mock_openid_1001`
  - `MOCK_USER_NICKNAME`，默认 `演示用户`

因此：

- 普通接口当前无需额外登录请求即可访问
- 管理端接口 `/api/admin/*` 额外要求请求头中存在 `x-admin-token`

### 2.4 文件上传约束

`POST /api/upload` 使用 `multer`，当前限制如下：

- 表单字段名：`file`
- 支持 MIME：`image/jpeg`、`image/png`
- 支持后缀：`.jpg`、`.jpeg`、`.png`
- 默认最大文件大小：`10MB`

### 2.5 静态资源访问

上传与生成后的图片保存在本地 `uploads/` 目录，并通过：

- `GET /uploads/<folder>/<filename>`

直接访问。

---

## 3. 健康检查

### GET `/health`

**用途**：探测服务是否启动。

**响应示例**：

```json
{
  "status": "ok"
}
```

---

## 4. 认证与用户接口

### GET `/api/auth/me`

**用途**：获取当前注入的用户信息。

**请求参数**：无。

**响应示例**：

```json
{
  "success": true,
  "code": 0,
  "message": "OK",
  "data": {
    "id": 1,
    "openid": "mock_openid_1001",
    "nickname": "演示用户",
    "status": 1,
    "created_at": "2026-03-18T00:00:00.000Z",
    "updated_at": "2026-03-18T00:00:00.000Z"
  }
}
```

### POST `/api/auth/admin/login`

**用途**：管理员登录占位接口。

**请求体**：当前实现未读取任何字段。

**响应示例**：

```json
{
  "success": true,
  "code": 0,
  "message": "OK",
  "data": {
    "token": "mock-admin-token"
  }
}
```

> 注意：该接口当前仅返回 mock token，`/api/admin/*` 实际只校验请求头中是否存在 `x-admin-token`。

---

## 5. 首页配置接口

### GET `/api/home/config`

**用途**：获取首页主入口与快捷入口配置。

**请求参数**：无。

**响应字段**：

- `mainCards[]`
  - `key`
  - `title`
  - `subtitle`
  - `icon`
  - `actionPath`
- `quickEntries[]`
  - `key`
  - `title`
  - `icon`
  - `actionPath`

### GET `/api/home/templates?category=popular`

**用途**：获取首页某一 tab 下的模板概览。

**查询参数**：

- `category`：可选，默认 `popular`

**当前可用首页分类 key**：

- `popular`
- `general`
- `medical`
- `language`
- `civil`
- `degree`
- `career`
- `passport`
- `police`
- `social`

**响应字段**：

- `tabs[]`
  - `key`
  - `label`
- `templates[]`
  - `sceneKey`
  - `name`
  - `pixelWidth`
  - `pixelHeight`
  - `hot`
  - `tip`
  - `tags`

**特殊说明**：

- 若 `category` 不存在，当前不会报错，而是返回合法 `tabs` 与空数组 `templates`
- 数据优先来自数据库表 `spec_templates`，缺表时会回退到内置常量

---

## 6. 规格模板接口

### GET `/api/spec/categories`

**用途**：获取规格分类列表。

**请求参数**：无。

**响应字段**：

- `key`
- `name`
- `sort`

### GET `/api/spec/list`

**用途**：分页查询规格模板。

**查询参数**：

- `category`：可选，规格分类 key
- `page`：可选，默认 `1`
- `pageSize`：可选，默认 `20`

**行为说明**：

- `page`、`pageSize` 只接受正整数，非法值自动回退默认值
- 当 `category` 非法时，返回 `400`

**响应字段**：

- `list[]`
  - `id`
  - `category`
  - `sceneKey`
  - `name`
  - `scene`
  - `tip`
  - `pixel`
  - `pixelWidth`
  - `pixelHeight`
  - `widthMm`
  - `heightMm`
  - `backgroundOptions`
  - `tags`
  - `hot`
  - `sort`
  - `actionPath`
- `total`
- `page`
- `pageSize`

### GET `/api/spec/detail/:id`

**用途**：获取单个规格模板详情。

**路径参数**：

- `id`：模板 ID，例如 `size_001`

**成功响应字段**：与 `/api/spec/list` 中的单项结构一致。

**失败场景**：

- 模板不存在：`404`

---

## 7. 场景模板接口

### GET `/api/scenes`

**用途**：获取已启用的场景模板列表。

**请求参数**：无。

**响应数据**：直接返回 `SceneTemplate` 模型数组，常见字段包括：

- `id`
- `scene_key`
- `scene_name`
- `width_mm`
- `height_mm`
- `pixel_width`
- `pixel_height`
- `description`
- `allow_beauty`
- `allow_print`
- `is_active`
- `sort_order`
- `created_at`
- `updated_at`

### GET `/api/scenes/:sceneKey`

**用途**：获取单个场景模板详情。

**路径参数**：

- `sceneKey`：如 `one_inch`、`passport`、`driver_license`

**响应数据**：单个 `SceneTemplate` 对象；未命中时当前实现会返回 `data: null`，不会主动抛出 404。

---

## 8. 上传与图像生成接口

### POST `/api/upload`

**用途**：上传原始图片，并创建一条 `images` 记录。

**请求类型**：`multipart/form-data`

**表单字段**：

- `file`：必填，原始图片文件

**成功响应示例**：

```json
{
  "success": true,
  "code": 0,
  "message": "OK",
  "data": {
    "imageId": 1,
    "originalUrl": "/uploads/original/20260318_xxx.jpg",
    "imageMeta": {
      "width": 1200,
      "height": 1600,
      "format": "jpeg",
      "size": 0
    }
  }
}
```

**说明**：

- `imageId` 是后续生成、下单、历史查询的核心关联字段
- `originalUrl` 是相对站点根路径的可访问 URL

### POST `/api/images/generate`

**用途**：基于已上传图片生成证件照、预览图，以及可选的排版图。

**请求体字段**：

- `imageId`：必填，来自上传接口
- `sourceType`：必填，`scene` 或 `custom`
- `sceneKey`：当 `sourceType=scene` 时必填
- `customWidthMm`：当 `sourceType=custom` 时必填
- `customHeightMm`：当 `sourceType=custom` 时必填
- `backgroundColor`：可选，默认 `white`；当前有效值建议使用 `white`、`blue`、`red`
- `beautyEnabled`：可选，布尔值
- `printLayoutType`：可选，支持 `six`、`eight`、`twelve`

**推荐请求示例（场景模式）**：

```json
{
  "imageId": 1,
  "sourceType": "scene",
  "sceneKey": "one_inch",
  "backgroundColor": "white",
  "beautyEnabled": true,
  "printLayoutType": "eight"
}
```

**推荐请求示例（自定义尺寸）**：

```json
{
  "imageId": 1,
  "sourceType": "custom",
  "customWidthMm": 25,
  "customHeightMm": 35,
  "backgroundColor": "blue",
  "beautyEnabled": false
}
```

**成功响应示例**：

```json
{
  "success": true,
  "code": 0,
  "message": "OK",
  "data": {
    "taskId": 10,
    "resultId": 15,
    "previewUrl": "/uploads/preview/20260318_xxx.jpg",
    "status": "success"
  }
}
```

**服务端当前实际处理链路**：

1. 校验 `imageId` 是否属于当前用户
2. 根据 `sceneKey` 或自定义宽高计算目标尺寸
3. 创建 `image_tasks` 记录，状态先置为 `processing`
4. 执行图像处理流水线：
   - 人脸检测
   - 抠图
   - 换底色
   - 裁剪到目标尺寸
   - 增强/美化
   - 质量检查
   - 生成预览图
5. 如请求了 `printLayoutType`，追加生成排版图
6. 创建 `image_results` 记录
7. 任务状态更新为 `success` 或 `failed`

**失败场景**：

- `imageId` 不存在或不属于当前用户：`404`
- `sceneKey` 不存在：`404`
- 图像处理异常：`500`

### GET `/api/tasks/:taskId`

**用途**：查询任务状态，可用于轮询。

**路径参数**：

- `taskId`

**响应字段**：当前返回 `ImageTask` 记录，并包含关联 `ImageResult`：

- `id`
- `image_id`
- `user_id`
- `task_type`
- `status`：`pending` / `processing` / `success` / `failed`
- `progress`
- `error_message`
- `started_at`
- `finished_at`
- `created_at`
- `updated_at`
- `ImageResult`

### GET `/api/images/history?page=1&pageSize=10`

**用途**：分页查询当前用户历史上传图片及其生成结果。

**查询参数**：

- `page`：可选，默认 `1`
- `pageSize`：可选，默认 `10`

**响应字段**：

- `list[]`：每项是 `Image` 对象，并带 `ImageResults`
- `total`
- `page`
- `pageSize`

### GET `/api/images/:imageId/detail`

**用途**：查询单张图片详情。

**路径参数**：

- `imageId`

**响应字段**：单个 `Image` 对象，并包含：

- `ImageResults[]`
- `ImageTasks[]`

> 注意：当前接口直接回传 Sequelize 对象序列化结果，字段命名主要为数据库下划线风格，例如 `original_url`、`file_size`、`created_at`。

---

## 9. 订单与支付接口

### POST `/api/orders`

**用途**：创建订单。

**请求体字段**：

- `imageId`：必填
- `resultId`：必填
- `orderType`：必填，支持：
  - `hd`
  - `print`
  - `package`

**金额规则**：

- `hd`：`9.9`
- `print`：`14.9`
- `package`：`19.9`
- 未命中时默认按 `9.9` 处理

**成功响应示例**：

```json
{
  "success": true,
  "code": 0,
  "message": "OK",
  "data": {
    "orderId": 100,
    "orderNo": "ORD20260318010101ABC123",
    "amount": 9.9,
    "status": "pending"
  }
}
```

### GET `/api/orders/:orderId`

**用途**：查询当前用户订单详情。

**路径参数**：

- `orderId`

**响应字段**：直接返回 `Order` 模型对象，常见字段包括：

- `id`
- `order_no`
- `user_id`
- `image_id`
- `result_id`
- `order_type`
- `amount`
- `currency`
- `status`
- `paid_at`
- `created_at`
- `updated_at`

### POST `/api/orders/:orderId/mock-pay`

**用途**：模拟支付成功。

**路径参数**：

- `orderId`

**行为说明**：

- 若订单不存在：返回 `404`
- 若订单已支付：直接返回订单对象
- 若支付成功：
  - 更新订单状态为 `paid`
  - 写入一条 `payment_records`
  - 根据订单类型回写 `image_results.is_paid_hd` / `is_paid_print`

**成功响应消息**：`Mock pay success`

---

## 10. 下载接口

### GET `/api/download/:resultId/preview`

**用途**：获取预览图下载地址，并记录下载日志。

**路径参数**：

- `resultId`

**成功响应**：

```json
{
  "success": true,
  "code": 0,
  "message": "OK",
  "data": {
    "downloadUrl": "/uploads/preview/xxx.jpg",
    "signed": false
  }
}
```

### GET `/api/download/:resultId/hd`

**用途**：获取高清图下载地址。

**前置条件**：

- `image_results.is_paid_hd = true`
- 当前用户存在已支付订单 `status=paid`

**失败场景**：

- 未购买高清图：`403`
- 无有效已支付订单：`403`

### GET `/api/download/:resultId/print`

**用途**：获取排版图下载地址。

**前置条件**：

- `image_results.is_paid_print = true`
- 当前用户存在已支付订单 `status=paid`

**失败场景**：

- 未购买排版图：`403`
- 无有效已支付订单：`403`

---

## 11. 管理后台接口

### GET `/api/admin/stats`

**用途**：获取管理后台统计数据。

**请求头**：

- `x-admin-token`: 任意非空字符串

**响应字段**：

- `userCount`
- `imageCount`
- `successTaskCount`
- `orderCount`
- `paidOrderCount`
- `hotScenes[]`
  - `scene_key`
  - `count`

**失败场景**：

- 缺少 `x-admin-token`：`401`

---

## 12. 与 Python 图像处理项目最相关的上游接口

如果你要把当前 Node 内部图像流水线替换成独立 Python 服务，通常至少需要关注以下上游入口：

1. `POST /api/upload`
   - 负责接收原始图片并产出 `imageId` / `originalUrl`
2. `POST /api/images/generate`
   - 这是驱动图像处理任务的核心业务入口
3. `GET /api/tasks/:taskId`
   - 用于查询任务执行结果
4. `GET /api/images/:imageId/detail`
   - 用于回显完整结果
5. `GET /api/download/:resultId/{preview|hd|print}`
   - 用于交付处理产物

如果 Python 项目只接收“处理指令”而不直接暴露给前端，则它应重点兼容 `POST /api/images/generate` 所需的参数语义：

- `imageId`
- `sourceType`
- `sceneKey`
- `customWidthMm`
- `customHeightMm`
- `backgroundColor`
- `beautyEnabled`
- `printLayoutType`

下游 Python 服务应至少能稳定产出：

- `previewUrl`
- `hdUrl`
- `printUrl`（按需）
- `qualityStatus`

