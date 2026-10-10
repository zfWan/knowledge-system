# 个人知识库（Knowledge System）

一个面向个人自托管场景的轻量知识库 + RAG 问答系统。

- 后端：NestJS + TypeScript + Prisma + SQLite（WAL 模式）
- 前端：React + TypeScript + Vite + TailwindCSS
- 检索：SQLite FTS5（全文）+ sqlite-vss（向量）
- AI：通过 OpenAI 兼容协议接入云端 LLM/Embedding（可插拔）
- 部署：Docker Compose 一键启动（web + server + 单 volume 数据目录）

详细技术设计见 [`docs/architecture.md`](./docs/architecture.md)。

## 目录结构

```
knowledge-system/
├── docs/              # 设计文档（architecture.md 等）
├── server/            # NestJS 后端
├── web/               # React 前端（Vite）
├── docker/nginx/      # 生产 Nginx 配置
├── scripts/           # 运维脚本（备份、回滚、初始化）
├── docker-compose.yml # 单机部署
├── .env.example       # 环境变量示例
└── package.json       # pnpm workspace 根
```

## 快速开始（开发）

依赖：Node.js >= 20.10、pnpm >= 9。

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量（至少配置 JWT_SECRET / LLM_API_KEY）
cp .env.example .env
#    编辑 .env 中相关字段

# 3. 初始化数据库
pnpm db:generate
pnpm db:migrate

# 4. 启动前后端开发服务（并行）
pnpm dev
# server  -> http://localhost:3000/api
# web     -> http://localhost:5173
```

## 快速开始（生产 Docker Compose）

```bash
cp .env.example .env
# 修改 JWT_SECRET / LLM_API_KEY / LLM_BASE_URL / LLM_CHAT_MODEL / EMBEDDING_MODEL
mkdir -p data
docker compose up -d --build
# 访问 http://<host>:8080
```

首次启动后在页面注册第一个账号即可使用（默认开放注册，可通过 `ALLOW_REGISTRATION=false` 关闭）。

## 常用脚本

```bash
pnpm dev              # 并行启动 server/web 开发模式
pnpm build            # 构建前后端
pnpm lint             # 代码检查
pnpm db:migrate       # 执行数据库迁移
pnpm db:generate      # 生成 Prisma Client
pnpm db:studio        # 打开 Prisma Studio
```

## V1.0 范围

P0 全链路：账号注册登录 → 笔记 Markdown 编辑/自动保存/分类标签 → 异步全文+向量索引 → 混合检索 → RAG 流式问答（引用溯源）→ 会话/额度/回收站/审计日志。

详细不做清单、选型理由、接口契约、数据模型、部署方案见 [docs/architecture.md](./docs/architecture.md)。
