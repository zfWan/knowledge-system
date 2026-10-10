#!/usr/bin/env sh
# 简单备份脚本：热备份 SQLite + 打包 uploads
set -e
DATA_DIR="${DATA_DIR:-./data}"
BACKUP_DIR="${BACKUP_DIR:-./data/backups}"
TS="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"
if command -v sqlite3 >/dev/null 2>&1 && [ -f "$DATA_DIR/app.db" ]; then
  sqlite3 "$DATA_DIR/app.db" ".backup '$BACKUP_DIR/app-$TS.db'"
else
  cp "$DATA_DIR/app.db" "$BACKUP_DIR/app-$TS.db" 2>/dev/null || true
fi
if [ -d "$DATA_DIR/uploads" ]; then
  tar -czf "$BACKUP_DIR/uploads-$TS.tar.gz" -C "$DATA_DIR" uploads
fi
echo "Backup done: $BACKUP_DIR/app-$TS.db"
# 清理 14 天前备份（可选）
find "$BACKUP_DIR" -name 'app-*.db' -mtime +14 -delete 2>/dev/null || true
find "$BACKUP_DIR" -name 'uploads-*.tar.gz' -mtime +14 -delete 2>/dev/null || true
