# 部署指南

👉 部署相关章节见 [`architecture.md §10 配置与环境变量`](./architecture.md#10-配置与环境变量) 与 [`§11 部署方案（Docker Compose 单机）`](./architecture.md#11-部署方案docker-compose-单机)。

本文档作为快速参考索引。

## 1. 本地开发

```bash
pnpm install
cp .env.example .env   # 修改 JWT_SECRET / LLM_* 等
pnpm db:generate
pnpm db:migrate:dev    # 开发环境，会自动创建本地 SQLite 文件
pnpm dev               # 并行启动 server (3000) 与 web (5173)
```

## 2. 生产部署（Docker Compose）

```bash
cp .env.example .env
# 修改：JWT_SECRET / LLM_API_KEY / LLM_BASE_URL / LLM_CHAT_MODEL / EMBEDDING_MODEL / APP_BASE_URL
mkdir -p data
docker compose up -d --build
# 访问 http://<host>:8080
```

Nginx 配置位于 `docker/nginx/nginx.conf`，已处理 gzip、静态资源缓存与 SSE（关闭 buffering）。
HTTPS 建议通过外层反代（Caddy / Nginx / Traefik / 云 LB）做 TLS 终结。

## 3. 备份与回滚

- 备份：`./scripts/backup.sh`（SQLite 热备 + 打包 uploads）。建议每天定时执行，保留最近 14 天。
- 回滚：代码 `git checkout <prev>` + `docker compose up -d --build`；数据使用 `./scripts/restore.sh <备份db> [<备份tar>]` 恢复。
- 升级：先备份 → `docker compose build --pull` → `docker compose up -d` → 观察 `/api/healthz`。

## 4. 健康检查

`GET /api/healthz` 返回：

```json
{ "status":"ok", "db":"ok", "llmConfigured":true, "version":"0.1.0" }
```

## 5. 开放注册

默认开放公开注册（首个注册即该实例的"拥有者"）；公网部署建议注册完成后在 `.env` 中设置 `ALLOW_REGISTRATION=false` 并重启。
