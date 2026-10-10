# AGENTS.md

本文件为 AI 编码助手（Agent）提供在本仓库工作时需要遵循的约定与操作指引。

## 项目概览

Knowledge System（知识系统）是一个 **monorepo** 风格的项目，前后端分离，数据持久化使用 SQLite。

- **架构形态**：pnpm workspace 管理的多包子仓库
- **后端**：NestJS + TypeScript
- **前端**：React + TypeScript + Vite
- **数据库**：SQLite（WAL 模式）+ Prisma ORM；全文检索 SQLite FTS5；向量检索 sqlite-vss
- **文档**：集中存放于 `docs/`

详细技术设计见 [`docs/architecture.md`](./docs/architecture.md)。

## 目录结构

```
knowledge-system/
├── docs/              # 项目文档（架构设计、部署、API 等）
├── server/            # 后端服务（NestJS）
│   ├── src/           # 源代码（按业务模块划分）
│   ├── prisma/        # Prisma schema + migrations
│   ├── data/          # 运行时生成：app.db、uploads/（.gitignore）
│   └── package.json
├── web/               # 前端应用（React + Vite）
│   ├── src/
│   └── package.json
├── docker/nginx/      # 生产 Nginx 配置
├── scripts/           # 运维脚本（备份/回滚/初始化）
├── docker-compose.yml # 单机部署
├── .env.example       # 环境变量示例
├── package.json       # 根 workspace 配置
├── pnpm-workspace.yaml
└── AGENTS.md          # 本文件
```

## 技术栈与约定

### 包管理（monorepo）

- 使用 **pnpm workspace** 管理多包；请勿混用 npm/yarn。
- 根脚本：`pnpm dev`（并行 dev）、`pnpm build`、`pnpm lint`、`pnpm db:migrate`、`pnpm db:studio` 等。
- Node 版本要求：`>= 20.10`（Docker 基础镜像 `node:20-alpine`）。

### 后端（server/ — NestJS）

- 框架：**NestJS**，语言 **TypeScript**；分层：Module / Controller / Service / Repository。
- 按业务域划分子模块（`auth/user/note/category/tag/attachment/storage/search/index/llm/embedding/rerank/chat/quota/audit/queue/mail/health`），通用能力收敛在 `src/common/`。
- 数据库访问：主表走 **Prisma**；FTS5/VSS 虚表通过 `$queryRaw` 在 `search/`、`index/` 模块集中管理，禁止业务层直接写 SQL。
- RESTful API 统一前缀 `/api`，统一响应格式 `{code,message,data,requestId}`，错误码分段（详见架构文档 §6）。
- 使用 DTO（class-validator/class-transformer）做入参校验；全局 `ValidationPipe`、`AllExceptionsFilter`、`ResponseInterceptor`、`RequestIdInterceptor` 已在 `main.ts` 注册。
- SSE 流式（`/api/chat/ask`）使用 NestJS SSE 原生支持，关闭 Nginx/代理 buffering。
- 所有用户资源查询必须携带 `user_id` 作为第一 WHERE 条件，严格遵守三层隔离（DB/FTS5/VSS）。
- 日志使用 pino 结构化日志，敏感字段（password/token/apiKey/content）必须脱敏。

### 前端（web/ — React + Vite）

- 框架：**React + TypeScript + Vite**；UI：**TailwindCSS**（预留 shadcn/ui 接入位）。
- 状态管理：推荐 **Zustand** + **TanStack Query**（后续编码节点按需引入）。
- 编辑器：Milkdown（Markdown-first WYSIWYG，见架构文档附录 B）。
- 路由：React Router v6；API 请求统一在 `src/lib/request.ts` 封装；SSE 流式封装在后续编码节点实现。
- 路径别名：`@/*` → `src/*`。

### 数据库（SQLite）

- 单一 SQLite 库文件 `server/data/app.db`，加入 `.gitignore`，运行时自动创建。
- 表结构变更必须通过 **Prisma migration** 管理；FTS5/VSS 虚表通过迁移 SQL 创建。
- 所有用户表必带 `user_id` 字段；ID 使用带前缀 NanoId（`user_/note_/chunk_/...`）。
- 软删（`deleted_at`）是默认删除语义；30 天 TTL 清理；彻底删除走 `/permanent` 接口。

## 常用命令

**根目录：**
```bash
pnpm install           # 安装全部依赖
pnpm dev               # 并行启动 server / web 开发服务
pnpm build             # 构建前后端
pnpm lint              # 代码规范检查
pnpm db:generate       # 生成 Prisma Client
pnpm db:migrate        # 执行数据库迁移（生产）
pnpm db:migrate:dev    # 开发环境创建并执行迁移
pnpm db:studio         # 打开 Prisma Studio
```

**仅后端：**
```bash
pnpm --filter server dev
pnpm --filter server build
pnpm --filter server start:prod
pnpm --filter server test
```

**仅前端：**
```bash
pnpm --filter web dev
pnpm --filter web build
pnpm --filter web preview
```

**Docker 部署：**
```bash
cp .env.example .env   # 修改 JWT_SECRET / LLM_* 等
docker compose up -d --build
```

## 环境准备

1. 安装 Node.js 20 LTS（>= 20.10）与 pnpm（>= 9）。
2. 根目录 `pnpm install`。
3. `cp .env.example .env` 并按需修改（至少改 `JWT_SECRET`、`LLM_API_KEY`）。
4. `pnpm db:generate` 生成 Prisma Client。
5. `pnpm db:migrate:dev`（开发）初始化本地数据库；生产 `pnpm db:migrate`。
6. `pnpm dev` 启动前后端开发服务。

## 代码风格与规范

- 统一使用 TypeScript；遵循 ESLint / Prettier 配置（`.eslintrc.cjs` / `.prettierrc`，后续在规范化节点引入）。
- 提交前建议运行 `pnpm lint` 与相关测试，确保无报错。
- 命名清晰、单一职责、避免过度抽象；注释、文档、错误提示文案使用 **中文**（技术术语保留英文）。
- 新增/修改功能时同步更新 `docs/` 相关文档。
- 禁止在代码中硬编码密钥/API Key/连接串，统一通过 `.env` 注入。

## 数据库迁移注意事项

⚠️ 涉及 SQLite 表结构变更时：

1. 始终创建 Prisma migration，不要直接手动修改数据库。
2. FTS5/VSS 虚表通过在 migration 目录内的 SQL 文件手动补充（`prisma/migrations/<migration>/` 下写 raw SQL）。
3. 本地验证 migration 可正常 up；破坏性迁移必须在升级文档中明确标注"需重建索引"或"不支持自动回滚，需从备份恢复"。
4. 修改后同步更新 `docs/architecture.md` 数据模型章节（§5）。

## Agent 工作准则

- **修改前先阅读**：改动子项目前先读相关代码与本文档，遵循既有约定；接口/数据/非功能约束以 `docs/architecture.md` 为准。
- **最小化改动**：只做任务要求的事，不顺手引入无关重构，不擅自引入 Redis/MySQL/PG/MQ/ES 等已明确不采用的中间件。
- **保持文档同步**：接口、目录结构、数据库、配置发生变化时，同步更新 `docs/` 与本文档。
- **安全红线**：禁止在日志/异常/产物/提交中泄露 token、密码、API Key、连接串、私钥；请求日志默认脱敏。
- **提交策略**：按工作流要求提交并推送到当前工作分支；提交信息使用中文简述本次变更。
