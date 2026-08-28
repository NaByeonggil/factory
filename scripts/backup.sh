#!/usr/bin/env bash
#
# 운영 백업 — DB 덤프와 업로드 파일을 한 쌍으로 남깁니다.
#
# DB 의 thumbnailUrl 은 파일 경로를 가리키기만 하므로, 둘 중 하나만
# 복원하면 이미지 링크가 끊어집니다. 그래서 항상 같은 타임스탬프로
# 두 파일을 함께 만듭니다.
#
#   ./scripts/backup.sh
#
# 환경변수 (.env 를 읽습니다)
#   DATABASE_URL   필수
#   UPLOAD_DIR     업로드 폴더 (기본 ./storage/uploads)
#   BACKUP_DIR     백업 보관 위치 (기본 ./backups)
#   BACKUP_KEEP    보관 일수 (기본 14)
#   PG_DOCKER      도커로 띄운 Postgres 라면 컨테이너 이름 (예: factory-db)
#
set -euo pipefail

cd "$(dirname "$0")/.."

# .env 를 읽되, 주석과 빈 줄은 건너뜁니다
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

: "${DATABASE_URL:?DATABASE_URL 이 설정되지 않았습니다}"
UPLOAD_DIR="${UPLOAD_DIR:-./storage/uploads}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_KEEP="${BACKUP_KEEP:-14}"

# Prisma 전용 쿼리 파라미터는 pg_dump 가 모릅니다 (schema=public 등).
# sslmode 같은 libpq 파라미터는 그대로 남겨야 하므로 골라서 걷어냅니다.
PG_URL="$DATABASE_URL"
for p in schema connection_limit pool_timeout pgbouncer socket_timeout; do
  PG_URL="$(printf '%s' "$PG_URL" | sed -E "s/[?&]${p}=[^&]*//g")"
done
# 파라미터를 걷어내면서 첫 구분자가 사라졌으면 다시 물음표로 되돌립니다
case "$PG_URL" in
  *\?*) ;;
  *\&*) PG_URL="$(printf '%s' "$PG_URL" | sed -E 's/&/?/')" ;;
esac

STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

DB_FILE="$BACKUP_DIR/db-$STAMP.dump"
FILES_FILE="$BACKUP_DIR/files-$STAMP.tar.gz"

# ── DB ──
# 실패하면 반쪽짜리 덤프가 남지 않도록 임시 파일에 받고 마지막에 옮깁니다
if [ -n "${PG_DOCKER:-}" ]; then
  docker exec "$PG_DOCKER" pg_dump "$PG_URL" \
    --format=custom --no-owner --no-privileges > "$DB_FILE.part"
else
  pg_dump "$PG_URL" \
    --format=custom --no-owner --no-privileges --file "$DB_FILE.part"
fi
mv "$DB_FILE.part" "$DB_FILE"

# ── 업로드 파일 ──
if [ -d "$UPLOAD_DIR" ]; then
  tar czf "$FILES_FILE.part" -C "$(dirname "$UPLOAD_DIR")" "$(basename "$UPLOAD_DIR")"
  mv "$FILES_FILE.part" "$FILES_FILE"
else
  echo "경고: 업로드 폴더가 없습니다 — $UPLOAD_DIR" >&2
fi

# ── 오래된 백업 정리 ──
find "$BACKUP_DIR" -maxdepth 1 -name 'db-*.dump' -mtime "+$BACKUP_KEEP" -delete
find "$BACKUP_DIR" -maxdepth 1 -name 'files-*.tar.gz' -mtime "+$BACKUP_KEEP" -delete

echo "백업 완료 ($STAMP)"
ls -lh "$DB_FILE" "$FILES_FILE" 2>/dev/null || true
echo
echo "복원:"
echo "  pg_restore --no-owner --no-privileges --clean --if-exists -d \"\$DATABASE_URL\" $DB_FILE"
echo "  tar xzf $FILES_FILE -C \"$(dirname "$UPLOAD_DIR")\""
