# AGENTS.md

本文件为 AI 编码助手（Agent）提供在本仓库工作时需要遵循的约定与操作指引。

## 项目概览

Knowledge System（知识系统）是一个 **monorepo** 风格的项目，前后端分离，数据持久化使用 SQLite。

- **架构形态**：单一仓库内包含多个独立子项目（workspace）
- **后端**：NestJS
- **前端**：React
- **数据库**：SQLite
- **文档**：集中存放于 `docs/`

## 目录结构

```
knowledge-system/
├── docs/              # 项目文档（设计、接口、部署等）
├── server/            # 后端服务（NestJS）
│   ├── src/           # 源代码
│   ├── test/          # 测试代码
│   └── package.json
├── web/               # 前端应用（React）
│   ├── src/           # 源代码
│   └── package.json
├── AGENTS.md          # 本文件：AI 编码约定
└── package.json       # 根 workspace 配置（可选，用于 monorepo 编排）
```

> 说明：若后续新增子项目，请置于仓库根目录下，并在本文档中同步更新目录说明。

## 技术栈与约定

### 后端（server/ — NestJS）

- 框架：**NestJS**，语言优先使用 **TypeScript**
- 分层结构：Module / Controller / Service / Provider，按功能模块组织
- 数据库访问通过 NestJS 的 SQLite 集成（如 TypeORM + `sqlite3` driver，或 Prisma + SQLite provider）
- RESTful API 路由统一加前缀（如 `/api`），保持接口风格一致
- 使用 DTO 做入参校验，统一异常处理，统一响应格式

### 前端（web/ — React）

- 框架：**React**，语言优先使用 **TypeScript**
- 组件化开发，按功能/页面模块组织目录
- 状态管理保持轻量（如 Context / Hooks，或引入成熟方案如 Zustand、Redux，需按需并在文档说明）
- API 请求集中封装，统一管理服务层
- 遵循组件命名与文件组织的一致性

### 数据库（SQLite）

- 单一 SQLite 数据库文件，建议存放于 `server/` 下（如 `server/data/app.db`），并加入 `.gitignore`，不提交到版本库
- 表结构变更必须通过 **迁移（migration）** 管理，禁止手工改动数据库文件
- 所有表与设计需同步记录到 `docs/` 中的数据库设计文档

## 常用命令

> 以下命令为约定示例，实际以各子项目 `package.json` 中的脚本为准。

**后端（在 `server/` 目录，或从根目录通过 workspace 调用）**

```bash
npm run start          # 启动开发服务
npm run start:dev      # 热重载开发模式
npm run build          # 构建生产包
npm run test           # 运行单元测试
npm run lint           # 代码规范检查
```

**前端（在 `web/` 目录）**

```bash
npm run dev            # 启动开发服务
npm run build          # 构建生产包
npm run test           # 运行测试
npm run lint           # 代码规范检查
```

**Monorepo（从根目录，若已配置 workspace 编排脚本）**

```bash
npm run dev            # 同时启动前后端开发服务
npm run build          # 构建全部子项目
```

## 环境准备

1. 确认已安装对应版本的 Node.js（建议 LTS）
2. 在根目录及各子项目安装依赖：`npm install`
3. 配置数据库：确认 SQLite 驱动已安装，migration 已初始化数据库文件
4. 环境变量：各子项目的 `.env` 不提交，参考对应的 `.env.example`（如有）

## 代码风格与规范

- 统一使用 **TypeScript**，遵循各子项目的 ESLint / Prettier 配置
- 提交代码前运行 `npm run lint` 与相关测试，确保无报错
- 命名清晰、单一职责、避免过度抽象；注释与文档使用 **中文**，技术术语可保留英文原文
- 新增/修改功能时，同步更新 `docs/` 中的相关文档（接口文档、数据库设计等）

## 数据库迁移注意事项

⚠️ 涉及 SQLite 表结构变更时：

1. 始终创建 migration 文件，**不要**直接手动修改数据库
2. 本地验证 migration 可正常 up / down
3. 修改后更新 `docs/` 中的数据库设计文档

## Agent 工作准则

- **修改前先行阅读**：改动任一子项目前，先阅读相关代码与本文档，遵循既有约定
- **最小化改动**：只做任务需要的事，不顺手引入无关重构
- **保持文档同步**：接口、目录结构、数据库发生变化时，同步更新 `docs/` 与本文档
- **不擅自新增依赖**：需要新依赖时先说明用途，由用户确认
- **提交策略**：不主动执行 git commit，除非用户明确要求