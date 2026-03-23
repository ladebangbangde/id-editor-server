# id-editor 商业级第一版（Server 方向）Docker 部署文档

## 1. 部署目标与架构边界

本方案面向 **id-editor-server** 的商业级第一版部署，整体采用双服务容器架构：

- **id-editor-server**（Node.js 主业务后端）
- **id-editor-tool**（Python AI 图像处理服务）

严格边界如下：

1. `id-editor-server` 与 `id-editor-tool` 必须是两个独立容器。
2. MySQL 部署在宿主机，不在 `docker-compose.yml` 中创建 MySQL 服务。
3. `id-editor-server` 通过 HTTP 调用 `id-editor-tool`，地址使用：
   - `AI_SERVICE_BASE_URL=http://id-editor-tool:8000`
4. 两个容器必须共享宿主机 uploads 目录挂载。

## 2. 服务职责说明

### id-editor-server（主业务后端）

负责：

- 上传接口
- 场景模板接口
- 调用 id-editor-tool
- 任务与结果管理
- 历史记录
- 创建订单
- mock 支付
- 下载权限控制

不负责：

- Python 图像处理
- 抠图实现
- AI 模型实现
- OpenCV/rembg/Pillow 等 AI 依赖

### id-editor-tool（AI 服务）

负责独立的 Python 图像处理流程，例如人像检测、抠图、换底、裁剪、排版等。

## 3. 为什么 MySQL 不放进 Docker Compose

第一版将 MySQL 固定为宿主机部署，原因：

- 降低初期容器编排复杂度，先稳定核心业务容器。
- 沿用已有 MySQL 运维体系（备份、监控、审计、权限管理）。
- 避免数据库容器误删卷造成数据风险。

> 说明：`docker-compose.yml` 中不创建 `mysql` 服务，`id-editor-server` 只通过环境变量连接宿主机数据库。

## 4. 目录结构与挂载约定

```text
id-editor/
  id-editor-server/
    Dockerfile
    .dockerignore
    .env.example
    package.json
    src/
  id-editor-tool/
    Dockerfile
  data/
    uploads/
      original/
      preview/
      hd/
      print/
      temp/
  docker-compose.yml
  docs/
    deployment-server.md
```

uploads 目录职责：

- `id-editor-server` 上传原图到：`uploads/original`
- `id-editor-tool` 输出结果到：
  - `uploads/preview`
  - `uploads/hd`
  - `uploads/print`
  - `uploads/temp`

两个容器内统一挂载路径为：`/app/uploads`。

## 5. 环境变量配置（id-editor-server）

复制模板并填写真实值：

```bash
cp id-editor-server/.env id-editor-server/.env
```

核心变量如下：

- `NODE_ENV=production`
- `PORT=3000`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_DIALECT`（默认 mysql）
- `DB_TIMEZONE`（默认 +08:00）
- `DB_URL`（可选，单连接串，优先于分散字段）
- `DB_CONFIG_JSON`（可选，JSON 字符串注入）
- `DB_CONFIG_FILE`（可选，JSON 文件路径，适合挂载外部配置）
- `AI_SERVICE_BASE_URL=http://id-editor-tool:8000`
- `UPLOAD_DIR=/app/uploads`
- `TOOL_SHARED_UPLOAD_ROOT=/app/uploads`
- `LOG_LEVEL=info`
- `JWT_EXPIRES_IN=7d`（可选，默认 7d）
- `WECHAT_APPID`
- `WECHAT_SECRET`
- `AUTH_MOCK_MODE=false`（生产建议显式关闭）
- `ORDER_CURRENCY=CNY`


### 数据库连接配置优先级（支持外部注入）

id-editor-server 的数据库配置按以下顺序覆盖（后者优先级更高）：

1. 基础环境变量：`DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD`
2. 配置文件：`DB_CONFIG_FILE` 指向的 JSON 文件（建议通过 Docker volume 挂载）
3. JSON 字符串：`DB_CONFIG_JSON`

另外：

- 如果提供 `DB_URL`（或在 JSON 中提供 `uri`），将优先使用连接串模式。
- `DB_CONFIG_FILE` / `DB_CONFIG_JSON` 可携带 `options` 字段，透传 Sequelize 连接参数。

`db.config.json` 示例：

```json
{
  "uri": "mysql://root:123456@host.docker.internal:3306/ai_id_photo",
  "options": {
    "dialect": "mysql",
    "timezone": "+08:00",
    "logging": false
  }
}
```

## 6. DB_HOST 配置说明（Linux / Mac / Windows）

不要把 `localhost` 写死在配置中。

- **Mac / Windows（Docker Desktop）**：通常可直接使用
  - `DB_HOST=host.docker.internal`
- **Linux**：
  1. 优先使用宿主机内网 IP（例如 `192.168.x.x`）
  2. 或使用 `host-gateway`（本 compose 已配置）并设置
     - `DB_HOST=host.docker.internal`

如果 Linux 环境 `host.docker.internal` 仍不可达，请切换为宿主机内网 IP。

## 7. 启动与运维命令

### 启动

```bash
docker compose up -d --build
```

### 查看状态

```bash
docker compose ps
```

### 查看日志

```bash
docker compose logs -f id-editor-server
docker compose logs -f id-editor-tool
```

### 重启服务

```bash
docker compose restart id-editor-server
docker compose restart id-editor-tool
```

### 停止并移除容器

```bash
docker compose down
```

## 8. 健康检查约定

接口详细说明见：`docs/api-reference.md`。

`id-editor-server` 约定提供：

- `GET /health`

返回结构：

```json
{
  "status": "ok"
}
```

`docker-compose.yml` 已配置 healthcheck，通过容器内 `curl`/`wget` 轮询 `/health`，用于：

- 启动后可用性确认
- 编排层快速识别异常实例
- 运维排障时快速定位服务状态

## 9. 日志与稳定性策略

第一版运维策略：

1. 应用日志输出到 stdout/stderr。
2. 使用 Docker 日志体系收集，不依赖仅写本地日志文件。
3. `restart: unless-stopped` 提升异常退出后的自动恢复能力。
4. 错误日志可直接通过 `docker compose logs` 查看。

## 10. 安全基线（第一版）

1. 不要把真实数据库密码、JWT 密钥提交到仓库。
2. 使用 `.env` 注入敏感配置。
3. `id-editor-server` 容器不内置 MySQL。
4. `id-editor-server` 不应直接把高清原图目录对公网静态暴露。
5. 第一版允许直接暴露 `3000` 端口，仅建议用于开发/内网测试。
6. 生产环境建议接入 Nginx 反向代理 + HTTPS（证书自动续期、限流、防护策略）。

## 11. 为什么不能把两个服务塞进同一容器

- 服务职责不同（业务编排 vs AI 计算），生命周期不同。
- 资源模型不同（Node I/O 密集 vs Python 计算密集）。
- 故障隔离更好，单服务故障不必拉跨整套系统。
- 更利于后续水平扩展（例如 AI 服务独立扩容）。

## 12. 第一版适用范围

该方案适用于：

- 开发环境
- 测试环境
- 单机生产首版（有基本运维能力）

后续可平滑演进到：

- Nginx + HTTPS
- 更细粒度监控/告警
- CI/CD 自动构建发布
- 多实例与负载均衡
