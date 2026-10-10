#!/usr/bin/env sh
# 用法：./scripts/restore.sh <备份 db 文件> [<备份 uploads tar.gz>]
set -e
DATA_DIR="${DATA_DIR:-./data}"
DB_BAK="${1:?usage: restore.sh <app-xxx.db> [uploads-xxx.tar.gz]}"
TAR_BAK="$2"

[ -f "$DB_BAK" ] || { echo "db backup not found: $DB_BAK"; exit 1; }
mkdir -p "$DATA_DIR"
[ -f "$DATA_DIR/app.db" ] && cp "$DATA_DIR/app.db" "$DATA_DIR/app.db.bak-$(date +%Y%m%d-%H%M%S)"
cp "$DB_BAK" "$DATA_DIR/app.db"
[ -n "$TAR_BAK" ] && [ -f "$TAR_BAK" ] && tar -xzf "$TAR_BAK" -C "$DATA_DIR"
echo "Restore done."
