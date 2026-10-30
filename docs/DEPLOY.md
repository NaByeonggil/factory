# 우분투 서버 배포 · 백업 · 복원

## 옮겨야 하는 것은 둘

| | 어디에 | git 포함 |
|---|---|---|
| **DB** (Postgres) | 원료·인증·팝업·문의·관리자 계정 | ❌ |
| **업로드 파일** | `UPLOAD_DIR` (기본 `./storage/uploads`) — 관리자에서 올린 원료 썸네일·인증 이미지·문의 첨부 | ❌ |
| 사이트 이미지 | `public/` — 히어로·아이콘·품목 사진 | ✅ 코드와 함께 배포됨 |

DB의 `thumbnailUrl` 은 `/api/media/pub/2026/08/<uuid>.jpg` 처럼 **파일 경로를 가리키기만 합니다.**
둘 중 하나만 옮기면 이미지 링크가 끊어지므로 **항상 같이** 옮기세요.

## 백업

```bash
npm run backup
```

`backups/` 에 같은 타임스탬프로 두 개가 생깁니다.

```
backups/db-20260828-232317.dump        # pg_dump custom format
backups/files-20260828-232317.tar.gz   # 업로드 폴더 통째
```

환경변수(.env)로 조정합니다.

| 변수 | 기본값 | 설명 |
|---|---|---|
| `BACKUP_DIR` | `./backups` | 보관 위치 |
| `BACKUP_KEEP` | `14` | 보관 일수. 지난 것은 자동 삭제 |
| `PG_DOCKER` | (빈값) | 도커로 띄운 Postgres 라면 컨테이너 이름 (예: `factory-db`) |

### 매일 자동 백업 (cron)

```bash
crontab -e
```

```cron
# 매일 새벽 3시
0 3 * * * cd /srv/factory && /usr/bin/npm run backup >> /var/log/factory-backup.log 2>&1
```

같은 서버 디스크에만 두면 디스크가 죽을 때 백업도 함께 사라집니다.
외부 저장소로 한 벌 더 보내세요.

```cron
# 매일 새벽 4시, 최근 백업을 외부로 동기화
0 4 * * * rsync -az --delete /srv/factory/backups/ user@backup-host:/backups/factory/
```

## 새 서버로 옮기기

```bash
# ── 1. 코드 ──
git clone <repo> /srv/factory && cd /srv/factory
npm ci

# ── 2. 환경변수 ──
cp .env.example .env
#  DATABASE_URL        운영 DB
#  NEXT_PUBLIC_SITE_URL 실제 도메인
#  AUTH_SECRET         openssl rand -base64 32  (로컬 값 재사용 금지)
#  IP_HASH_SALT        같이 새로 생성
#  RESEND_API_KEY / NOTIFY_TO   비우면 문의 알림이 콘솔에만 남습니다
#  UPLOAD_DIR          앱 폴더 밖 절대경로 — 아래 주의 참고

# ── 3. DB ──
sudo -u postgres createdb factory
pg_restore --no-owner --no-privileges -d "$DATABASE_URL" db-YYYYMMDD-HHMMSS.dump
npm run db:deploy     # 덤프 이후에 추가된 마이그레이션만 적용됩니다

# ── 4. 업로드 파일 ──
mkdir -p /srv/factory-storage
tar xzf files-YYYYMMDD-HHMMSS.tar.gz -C /srv/factory-storage

# ── 5. 빌드·기동 ──
npm run build
npm run start         # 실서비스는 pm2 나 systemd 로 감싸세요
```

**`npm run db:seed` 는 돌리지 마세요.** 복원한 데이터 위에 데모 데이터를 다시 덮어씁니다.

### 주의 — `UPLOAD_DIR` 은 앱 폴더 밖에

기본값 `./storage/uploads` 를 그대로 쓰면, 배포할 때 앱 디렉터리를 갈아끼우는 순간
**올린 이미지가 전부 날아갑니다.** 운영에서는 절대경로로 두세요.

```
UPLOAD_DIR="/srv/factory-storage/uploads"
```

## 데모 데이터 정리

시드는 데모 원료 7종·제품 4종·소식 4건·팝업 3건을 넣습니다.
그대로 운영에 올리면 **고객에게 가짜 제품이 보입니다.**

```bash
npm run db:clean-demo              # 무엇이 지워질지 보기만
npm run db:clean-demo -- --yes     # 실제 삭제
npm run storage:cleanup            # 참조가 끊긴 이미지 정리 (24시간 지난 것만)
```

지우는 대상은 스크립트에 적힌 slug 뿐이라, 관리자에서 직접 등록하신 것은 지워지지 않습니다.
문의까지 비우려면 `-- --yes --with-inquiries` 를 붙이세요.

## 복원 확인

복원한 뒤 이것만은 눈으로 확인하세요.

1. `/ko/ingredients` — 원료 카드 **이미지가 보이는지** (DB만 복원했으면 여기서 깨집니다)
2. `/admin` 로그인
3. 문의를 한 건 넣어 보고 **알림 메일이 오는지**

## Gmail 메일 분류 켜기

관리자 화면 `/admin/mail` 은 받은편지함의 새 메일을 3분마다 확인해 로컬 LLM 으로 분류·요약합니다.

1. [Google Cloud 콘솔](https://console.cloud.google.com/)에서 프로젝트를 만들고 **Gmail API** 를 사용 설정합니다.
2. OAuth 동의 화면을 **외부** 로 만들고 **프로덕션으로 게시** 합니다. 테스트 상태로 두면 인증이 7일마다 만료됩니다. 검수를 받지 않은 앱이라 연결할 때 경고 화면이 나오며, 「고급」에서 계속 진행합니다.
3. OAuth 클라이언트 ID 를 **웹 애플리케이션** 으로 만들고, 승인된 리디렉션 URI 에 `https://factory.cancerwith.kr/admin/mail/oauth/callback` 을 넣습니다.
4. `.env` 에 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 을 넣고 배포합니다.

```bash
npm run db:deploy
docker compose up -d --build app
```

5. 관리자(ADMIN)로 로그인해 `/admin/mail` 에서 「Gmail 연결」을 누릅니다. 최근 메일 50건을 가져와 정리합니다.
6. 분류 결과를 확인한 뒤 「Gmail에 라벨 달기」를 켭니다. 처음에는 꺼져 있습니다.

메일 본문은 DB 에 저장하지 않습니다. `AUTH_SECRET` 을 바꾸면 연결을 해제하고 다시 연결해야 합니다.
