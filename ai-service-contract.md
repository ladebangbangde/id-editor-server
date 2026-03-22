# Python 图片处理服务对接契约（最新版）

> 本文档基于当前 `id-editor` 仓库实际代码整理，目标是让独立的 Python 图片处理项目可以直接按本文档接收“处理指令”、返回“处理结果”，从而无缝接入当前 Node.js 主业务后端。

---

## 1. 文档目标

当前 Node.js 服务已经对外暴露完整业务接口，但图像处理链路仍以内置模块方式执行。为了把图像处理能力迁移到独立 Python 项目，Python 服务需要遵守一套稳定、可替换、可扩展的 HTTP 接口契约。

本文档同时回答三个问题：

1. Node 主服务会在什么场景下向 Python 服务发起调用
2. Python 服务需要接收哪些字段
3. Python 服务必须返回哪些结果，才能让当前订单、历史、下载链路继续工作

---

## 2. 当前真实业务入口

前端/调用方当前只调用 Node 主服务，不直接调用 Python 服务。

真实链路是：

```text
Client / Mini Program / Web
        ↓
Node.js server
        ↓
Python image service
```

在当前代码里，真正触发图像处理的上游接口是：

- `POST /api/images/generate`

因此，Python 服务的任务语义必须与这个接口保持一致。

---

## 3. Node 主服务当前使用到的处理步骤

Node 内置流水线 `generate-id-photo.js` 当前依次执行：

1. 人脸检测 `detect`
2. 抠图分割 `segment`
3. 背景替换 `replaceBackground`
4. 尺寸裁剪 `cropToSpec`
5. 图像增强 `enhance`
6. 质量检查 `check`
7. 预览图生成 `buildPreview`
8. 可选排版图生成 `generatePrintLayout`

因此，Python 服务有两种设计方式：

### 方案 A：提供一个总控接口

由 Python 服务一次性完成完整流程，Node 只调用一次。

### 方案 B：提供多个细分接口

由 Node 分步骤调用 Python 服务的多个能力接口。

**推荐使用方案 A。**

原因：

- 更容易做超时控制与错误收敛
- 更适合 Python 侧集中管理模型加载
- 更方便后续切换异步队列/任务系统
- 能减少 Node 与 Python 之间的网络往返次数

下文以“推荐方案 A”为主，同时给出“兼容方案 B”。

---

## 4. 基础约定

### 4.1 协议

- HTTP/1.1 或 HTTP/2
- `Content-Type: application/json`
- 编码：`UTF-8`

### 4.2 建议基础地址

示例：

- `http://127.0.0.1:8000`

建议 Node 侧配置项：

- `PY_IMAGE_SERVICE_BASE_URL=http://127.0.0.1:8000`

### 4.3 统一字段命名

**必须全部使用 camelCase。**

例如：

- `imageId`
- `taskId`
- `sourceType`
- `sceneKey`
- `customWidthMm`
- `customHeightMm`
- `backgroundColor`
- `beautyEnabled`
- `printLayoutType`
- `originalImagePath`
- `previewUrl`
- `hdUrl`
- `printUrl`
- `qualityStatus`

不要混用：

- `snake_case`
- `kebab-case`

### 4.4 统一响应格式

#### 成功

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

#### 失败

```json
{
  "success": false,
  "message": "Error message",
  "data": null
}
```

说明：

- Python 服务不需要返回与 Node 一致的 `code: 0`
- 但必须返回 `success`、`message`、`data`
- HTTP 状态码需与错误语义一致

---

## 5. 推荐接口设计（Python 服务）

Python 服务建议至少提供以下 4 个接口：

1. `GET /health`
2. `POST /v1/id-photo/generate`
3. `POST /v1/print-layout/generate`
4. `POST /v1/image/detect`

其中：

- `POST /v1/id-photo/generate` 是最核心接口
- 其余接口用于独立排版、调试与健康检查

---

## 6. 核心接口：生成证件照

### 6.1 请求

#### `POST /v1/id-photo/generate`

```json
{
  "imageId": 123,
  "taskId": 456,
  "sourceType": "scene",
  "sceneKey": "one_inch",
  "customWidthMm": null,
  "customHeightMm": null,
  "targetWidthPx": 295,
  "targetHeightPx": 413,
  "backgroundColor": "white",
  "beautyEnabled": true,
  "printLayoutType": "eight",
  "originalImagePath": "/workspace/id-editor/uploads/original/abc.jpg",
  "outputDir": "/workspace/id-editor/uploads",
  "needPreview": true,
  "needHd": true,
  "needPrint": true
}
```

### 6.2 字段说明

- `imageId`：主服务图片 ID
- `taskId`：主服务任务 ID，便于日志追踪
- `sourceType`：`scene` 或 `custom`
- `sceneKey`：场景模式下传入，例如 `one_inch`、`passport`、`driver_license`
- `customWidthMm`：自定义模式宽度，单位 mm
- `customHeightMm`：自定义模式高度，单位 mm
- `targetWidthPx`：主服务已计算好的目标宽度，单位 px
- `targetHeightPx`：主服务已计算好的目标高度，单位 px
- `backgroundColor`：建议支持 `white`、`blue`、`red`
- `beautyEnabled`：是否启用美化
- `printLayoutType`：可选，`six`、`eight`、`twelve`
- `originalImagePath`：原图绝对路径
- `outputDir`：输出根目录
- `needPreview`：是否生成预览图
- `needHd`：是否生成高清图
- `needPrint`：是否生成排版图

### 6.3 处理要求

Python 服务至少需要完成这些动作：

1. 检测图片中是否存在有效人脸
2. 完成人像主体分割/抠图
3. 按背景色进行底色替换
4. 按 `targetWidthPx` / `targetHeightPx` 输出标准尺寸照片
5. 视情况进行美化/增强
6. 生成预览图
7. 根据 `printLayoutType` 生成排版图（可选）
8. 输出质量检查结论

### 6.4 成功响应

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "previewUrl": "/uploads/preview/123_preview.jpg",
    "hdUrl": "/uploads/hd/123_hd.jpg",
    "printUrl": "/uploads/print/123_print_8.jpg",
    "previewPath": "/workspace/id-editor/uploads/preview/123_preview.jpg",
    "hdPath": "/workspace/id-editor/uploads/hd/123_hd.jpg",
    "printPath": "/workspace/id-editor/uploads/print/123_print_8.jpg",
    "qualityStatus": "passed",
    "qualityScore": 92,
    "issues": [],
    "faceDetected": true,
    "faceCount": 1,
    "generatedAt": "2026-03-18T00:00:00.000Z"
  }
}
```

### 6.5 响应字段要求

下列字段是 **Node 主服务最需要的最小返回集**：

- `previewUrl`
- `hdUrl`
- `qualityStatus`

下列字段是 **强烈建议返回**：

- `printUrl`
- `previewPath`
- `hdPath`
- `printPath`
- `qualityScore`
- `issues`
- `generatedAt`

### 6.6 qualityStatus 枚举

建议固定为：

- `passed`
- `warning`
- `failed`

当前 Node 代码只显式使用了：

- `passed`
- `failed`

但为后续扩展，建议 Python 服务保留 `warning`。

### 6.7 失败响应示例

#### 无人脸

```json
{
  "success": false,
  "message": "No valid face detected",
  "data": {
    "reason": "NO_FACE"
  }
}
```

#### 多人脸

```json
{
  "success": false,
  "message": "Multiple faces detected",
  "data": {
    "reason": "MULTIPLE_FACES",
    "faceCount": 2
  }
}
```

#### 图像质量不合格

```json
{
  "success": false,
  "message": "Image quality check failed",
  "data": {
    "reason": "QUALITY_FAILED",
    "issues": ["blur", "bad_exposure"]
  }
}
```

---

## 7. 排版图接口（可独立调用）

### `POST /v1/print-layout/generate`

```json
{
  "imageId": 123,
  "hdImagePath": "/workspace/id-editor/uploads/hd/123_hd.jpg",
  "printLayoutType": "eight",
  "outputDir": "/workspace/id-editor/uploads"
}
```

### 成功响应

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "printUrl": "/uploads/print/123_print_8.jpg",
    "printPath": "/workspace/id-editor/uploads/print/123_print_8.jpg",
    "count": 8
  }
}
```

### `printLayoutType` 枚举

- `six`
- `eight`
- `twelve`

当前 Node 侧映射关系：

- `six` -> 6 张
- `eight` -> 8 张
- `twelve` -> 12 张

---

## 8. 检测接口（调试/预检查）

### `POST /v1/image/detect`

```json
{
  "imageId": 123,
  "originalImagePath": "/workspace/id-editor/uploads/original/abc.jpg"
}
```

### 成功响应

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "hasFace": true,
    "faceCount": 1,
    "faceBox": {
      "x": 100,
      "y": 80,
      "width": 320,
      "height": 420
    },
    "poseValid": true,
    "blurScore": 0.1,
    "occlusionDetected": false
  }
}
```

---

## 9. 健康检查接口

### `GET /health`

```json
{
  "success": true,
  "message": "Python image service is running",
  "data": {
    "service": "python-image-service"
  }
}
```

---

## 10. 输出文件约定

为了兼容当前 Node 主服务的静态资源挂载方式，建议 Python 服务直接把文件输出到 Node 服务使用的 `uploads/` 目录下。

### 10.1 目录约定

- 原图：`uploads/original/`
- 预览图：`uploads/preview/`
- 高清图：`uploads/hd/`
- 排版图：`uploads/print/`
- 临时文件：`uploads/temp/`

### 10.2 URL 约定

Python 服务返回给 Node 的 URL 建议使用：

- `\` 不允许出现，统一使用 `/`
- 建议返回站点相对路径，例如：
  - `/uploads/preview/123_preview.jpg`
  - `/uploads/hd/123_hd.jpg`
  - `/uploads/print/123_print_8.jpg`

这样 Node 可以直接入库，不必再次转换。

### 10.3 文件命名建议

建议至少包含以下信息：

- `imageId`
- 输出类型
- 可选布局张数
- 时间戳或随机串

例如：

- `123_preview_20260318.jpg`
- `123_hd_20260318.jpg`
- `123_print_8_20260318.jpg`

---

## 11. 与当前 Node 主服务字段映射关系

Python 服务返回后，Node 主服务最终需要写入 `image_results` 的字段包括：

- `preview_url`
- `hd_url`
- `print_url`
- `background_color`
- `width_mm`
- `height_mm`
- `pixel_width`
- `pixel_height`
- `quality_status`

因此 Python 服务返回体至少要能支撑如下映射：

| Python 返回字段 | Node 入库字段 | 必需 |
|---|---|---|
| `previewUrl` | `preview_url` | 是 |
| `hdUrl` | `hd_url` | 是 |
| `printUrl` | `print_url` | 否 |
| `qualityStatus` | `quality_status` | 是 |

---

## 12. Node 到 Python 的实际指令来源

Node 主服务当前在处理 `POST /api/images/generate` 时，实际会从业务层整理出这些语义：

### 场景模式

```json
{
  "imageId": 123,
  "sourceType": "scene",
  "sceneKey": "one_inch",
  "backgroundColor": "white",
  "beautyEnabled": true,
  "printLayoutType": "eight"
}
```

Node 会再自行补齐：

- `originalImagePath`
- `targetWidthPx`
- `targetHeightPx`
- `taskId`
- 输出目录信息

### 自定义模式

```json
{
  "imageId": 123,
  "sourceType": "custom",
  "customWidthMm": 25,
  "customHeightMm": 35,
  "backgroundColor": "blue",
  "beautyEnabled": false
}
```

---

## 13. 推荐错误码语义

虽然当前 Node 内置实现主要依赖 HTTP 状态码，但 Python 服务建议额外在 `data.reason` 中返回稳定错误原因，便于 Node 后续映射业务提示。

建议值：

- `NO_FACE`
- `MULTIPLE_FACES`
- `FACE_TOO_SMALL`
- `BAD_POSE`
- `BAD_EXPOSURE`
- `QUALITY_FAILED`
- `UNSUPPORTED_BACKGROUND`
- `INVALID_LAYOUT_TYPE`
- `FILE_NOT_FOUND`
- `MODEL_ERROR`
- `INTERNAL_ERROR`

---

## 14. 兼容方案 B：细分能力接口

如果 Python 项目更适合拆分实现，也可以提供以下细分接口，并由 Node 逐步调用：

- `POST /v1/detect`
- `POST /v1/segment`
- `POST /v1/background/replace`
- `POST /v1/crop`
- `POST /v1/enhance`
- `POST /v1/quality-check`
- `POST /v1/print-layout/generate`

但请注意：

- 这会增加链路复杂度
- Node 侧也需要改造更多逻辑
- 不如总控接口易于维护

因此仍然推荐优先交付：

- `POST /v1/id-photo/generate`

---

## 15. Python 项目落地建议

如果你要把本文档直接发给 Python 图片处理项目，可以把任务拆成下面几个里程碑：

### 第一阶段：最小可用版本

实现：

- `GET /health`
- `POST /v1/id-photo/generate`

至少支持：

- 单人脸检测
- 换白/蓝/红底
- 输出标准尺寸高清图
- 输出预览图
- 返回 `qualityStatus`

### 第二阶段：增强能力

补齐：

- `printLayoutType`
- 更精确的人像裁切
- 质量评分与问题列表
- 美颜/锐化开关

### 第三阶段：生产化能力

补齐：

- 异步任务队列
- 模型预热
- 批量处理
- Prometheus 指标
- Trace ID / taskId 全链路日志

---

## 16. 结论

对于当前 `id-editor` 仓库，**真正需要 Python 项目兼容的核心指令入口只有一个：**

- `POST /v1/id-photo/generate`

它必须严格承接 Node `POST /api/images/generate` 的语义，并稳定返回：

- `previewUrl`
- `hdUrl`
- `printUrl`（按需）
- `qualityStatus`

只要这组契约稳定，当前上传、历史、订单、支付、下载接口都可以继续沿用，无需前端改动。

