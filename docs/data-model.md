# 数据模型

数据模型在架构设计文档中有完整定义，包含 ER 概览、字段表、索引策略、FTS5 / sqlite-vss 虚表与三层隔离方案。

👉 **主文档：** [`architecture.md §5 数据模型`](./architecture.md#5-数据模型)

要点：
- 主表（users / notes / categories / tags / note_chunks / conversations / messages / refresh_tokens / quota_daily / audit_logs / attachments / note_versions / note_tags）由 Prisma schema 管理（见 `server/prisma/schema.prisma`）。
- SQLite 不支持 enum，状态/角色/结果等枚举字段使用 `String` + 应用层 DTO 校验。
- FTS5 虚表 `note_chunks_fts` 与 sqlite-vss 虚表 `note_chunks_vss` 不写入 Prisma schema，通过 migration raw SQL 创建（首版迁移 `20261010070009_init` 之后的增量迁移补充）。
- 三层隔离：所有用户资源表必带 `user_id`；FTS5/VSS 检索后必须二次过滤 `user_id`。
- ID 规范：使用 NanoId 带前缀（`user_/note_/chunk_/...`），不使用自增 ID。
