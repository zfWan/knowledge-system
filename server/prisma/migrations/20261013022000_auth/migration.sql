-- AlterTable: users.password_hash nullable; add failed_attempts, locked_until
-- 注意：SQLite ALTER 限制较多，这里使用新增列即可（nullable 或带 default）

ALTER TABLE "users" ADD COLUMN "failed_attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "locked_until" DATETIME;

-- 由于原 migration 中 password_hash 为 NOT NULL，需要在新迁移中改为 nullable。
-- SQLite 无法直接 ALTER COLUMN NOT NULL → NULL，通过 rebuild 表的方式过于复杂；
-- 为保持开发阶段简单，这里不重写 init migration，而是：
-- 对于现有测试数据（无数据时），直接让 password_hash 保持 NOT NULL 并允许应用层写入占位 hash。
-- 短信即注册即登录场景，我们写入一个不可登录的 argon2 占位哈希（不允许任何密码匹配），
-- 因此 passwordHash 字段保持 NOT NULL 即可，避免 rebuild 表。

-- CreateTable: sms_codes
CREATE TABLE "sms_codes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "scene" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "fail_count" INTEGER NOT NULL DEFAULT 0,
    "daily_count" INTEGER NOT NULL DEFAULT 0,
    "last_sent_at" DATETIME,
    "used_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT,
    CONSTRAINT "sms_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "sms_codes_phone_scene_created_at_idx" ON "sms_codes"("phone", "scene", "created_at");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- AlterTable: audit_logs add account/reason columns
ALTER TABLE "audit_logs" ADD COLUMN "account" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN "reason" TEXT;
