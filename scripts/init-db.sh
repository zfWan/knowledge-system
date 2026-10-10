#!/usr/bin/env sh
# 初始化数据库：执行 prisma migrate
set -e
cd "$(dirname "$0")/../server"
pnpm prisma migrate deploy
echo "DB initialized."
