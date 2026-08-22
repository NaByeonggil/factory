# 헬씨팜바이오 — 건강기능식품 OEM/ODM 기업 사이트

네이버 CPC 광고 유입을 **생산문의 전환**으로 연결하는 것을 1순위 목표로 설계된
B2B 리드젠 사이트입니다. 콘텐츠(원료·포트폴리오·소식) CMS와 문의 관리 백오피스를 포함합니다.

## 기술 스택

| 영역 | 선택 |
|---|---|
| 프레임워크 | Next.js 16 (App Router, Server Actions, Turbopack) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS v4 (`@theme` 토큰) |
| DB | PostgreSQL + Prisma 7 (`@prisma/adapter-pg`) |
| 다국어 | next-intl (ko / en / zh) |
| 폼 | react-hook-form + Zod v4 (서버·클라이언트 스키마 공유) |
| 관리자 인증 | jose(JWT httpOnly 쿠키) + bcryptjs |
| 알림 | Resend (미설정 시 콘솔 출력) |

## 시작하기

```bash
cp .env.example .env       # AUTH_SECRET, IP_HASH_SALT 등 채우기
npm install
docker compose up -d       # 로컬 PostgreSQL 17 기동 (localhost:5432)
npm run db:deploy          # 마이그레이션 적용 (개발 중 스키마 변경은 npm run db:migrate)
npm run db:seed            # 관리자 계정 + 샘플 원료/인증 데이터
npm run dev
```

DB 컨테이너 제어:

```bash
docker compose stop        # 중지 (데이터 유지)
docker compose down -v     # 삭제 (데이터까지 제거)
docker exec -it factory-db psql -U dev -d factory   # psql 접속
```

- 사이트: http://localhost:3000 → `/ko` 로 리다이렉트
- 관리자: http://localhost:3000/admin (시드 기본 계정 `admin@example.com` / `changeme1234`)

`AUTH_SECRET` 생성: `openssl rand -base64 32`

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | `prisma generate` 후 프로덕션 빌드 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:migrate` | 개발용 마이그레이션 생성·적용 |
| `npm run db:deploy` | 운영 마이그레이션 적용 |
| `npm run db:seed` | 시드 데이터 |
| `npm run db:studio` | Prisma Studio |
| `npm run storage:cleanup` | 고아 첨부파일 삭제 |

## 구조

```
prisma/
  schema.prisma            도메인 모델 (문의·원료·포트폴리오·게시물·인증·관리자)
  migrations/              초기 마이그레이션 SQL
  seed.ts                  관리자 계정 + 샘플 데이터
src/
  proxy.ts                 Next 16 미들웨어: 로케일 라우팅 + /admin 인증 가드
  i18n/                    next-intl 라우팅·네비게이션·요청 설정
  messages/{ko,en,zh}.json 번역 카탈로그 (키 154개, 3개 언어 동기화)
  lib/
    prisma.ts              PrismaClient 싱글턴 (pg 어댑터)
    queries.ts             DB 조회 헬퍼 (미연결 시 빈 데이터로 폴백)
    tracking.ts            광고 유입 파라미터 파싱·보관
    validations/inquiry.ts Zod 스키마 (서버·클라이언트 공유)
    auth.ts / session.ts   관리자 세션 (쿠키 / 순수 JWT 분리)
    rate-limit.ts          문의·로그인 레이트리밋
    notify.ts              문의 접수 알림
  actions/                 Server Actions (submitInquiry, 관리자 액션)
  components/              ui / site / inquiry / admin / tracking
  app/
    [locale]/(site)/       공개 사이트 (홈·문의·원료)
    admin/                 백오피스 (로그인 · 대시보드 · 문의 관리)
    sitemap.ts robots.ts
```

## 렌더링 전략

광고 랜딩 속도가 곧 전환율이므로 마케팅 페이지는 **정적 프리렌더**입니다.

빌드 시 **57개 경로가 프리렌더**되며, 동적 렌더링은 `/community` 리다이렉트와 관리자뿐입니다.

| 라우트 | 전략 |
|---|---|
| `/[locale]` (홈) | SSG + ISR 600초 |
| `/[locale]/about/**`, `/[locale]/service/**` | SSG (본문은 메시지 카탈로그) |
| `/[locale]/legal/**` | SSG |
| `/[locale]/inquiry` | SSG (쿼리 `?type=`·`?ingredient=` 는 클라이언트에서 읽음) |
| `/[locale]/inquiry/complete` | SSG, `noindex` — 광고 전환 태그 발화 지점 |
| `/[locale]/ingredients` | SSG + ISR (카테고리 필터는 클라이언트 처리) |
| `/[locale]/ingredients/[slug]` | SSG + ISR (`generateStaticParams`) |
| `/[locale]/portfolio`, `/portfolio/[slug]` | SSG + ISR |
| `/[locale]/community/[category]`, `.../[slug]` | SSG + ISR |
| `/admin/**` | 동적, `noindex` |

> Next 16에서는 `generateStaticParams`만으로는 페이지가 SSG로 잡히지 않고 동적으로 남습니다.
> 정적으로 만들려면 `export const dynamic = "force-static"`을 함께 선언해야 합니다.

### 서버에서 searchParams를 읽지 말 것

서버 컴포넌트에서 `props.searchParams`를 읽으면 그 라우트 전체가 동적으로 전환됩니다.
문의 폼의 `?type=`·`?ingredient=`, 원료 목록의 `?category=`는 모두 클라이언트
(`useSearchParams`)에서 처리해 정적 프리렌더를 유지하고 있습니다.

## 다국어 — locale은 항상 명시적으로 전달

`setRequestLocale()`에 의존하지 **마세요**. Turbopack이 next-intl 내부 모듈을 중복
번들링하면 React `cache()` 스코프가 갈라져, `setRequestLocale("en")` 직후에도
`getLocale()`이 기본 로케일(`ko`)을 반환합니다. 페이지 전체가 조용히 한국어로
렌더링되며 `<title>`만 정상으로 보이기 때문에 발견이 늦습니다.

이 프로젝트는 다음 규칙을 따릅니다.

```tsx
// ❌ 하지 말 것
const t = await getTranslations("home");

// ✅ 항상 locale 명시
const t = await getTranslations({ locale, namespace: "home" });
```

- `[locale]/layout.tsx` 가 `getMessages({ locale })` 로 메시지를 읽어
  `<NextIntlClientProvider locale={locale} messages={messages}>` 에 직접 넘깁니다.
  클라이언트 컴포넌트는 이 컨텍스트에서 로케일을 받습니다.
- 서버 컴포넌트는 `locale` 을 prop으로 받아 `getTranslations({ locale, namespace })` 를 씁니다.
- 정적 마케팅 페이지 본문은 `src/messages/*.json` 의 `pages.<key>` 에 있고,
  `MarketingPage` 컴포넌트가 렌더링합니다. 섹션(`bullets`/`features`/`steps`/`faq`)은
  모두 선택 사항이며 키가 없으면 렌더링되지 않습니다.

## 광고 유입 추적 (핵심)

문의 페이지로 이동하면 URL의 광고 파라미터가 사라지므로,
**최초 랜딩 시점에** `AttributionCapture`가 `sessionStorage`에 first-touch로 고정 저장하고
문의 제출 시 함께 전송합니다.

수집 대상: `utm_*`, `n_keyword`, `n_query`, `n_rank`, `n_ad_group`, `n_ad`, `NaPm`,
`gclid`, `fbclid` (화이트리스트) + `referrer` + 랜딩 경로.
원본 쿼리스트링 전체는 `Inquiry.rawParams`(JSON)에 보관합니다.

관리자 대시보드에서 **최근 30일 유입 키워드 TOP 10**을 집계합니다
(`@@index([utmSource, naverKeyword])`).

전환 태그(GA4 `generate_lead`, 네이버 프리미엄로그분석)는 `/inquiry/complete`에서만 발화합니다.

## 스팸·개인정보

- 허니팟 필드 + IP 해시 기준 레이트리밋(10분 5회) + Cloudflare Turnstile(키 설정 시 활성)
- 개인정보 동의 체크 필수, **동의 시각**을 `privacyAgreedAt`에 저장
- IP는 원문 대신 `IP_HASH_SALT` 기반 SHA-256 해시만 보관
- 문의 목록에서 연락처 마스킹 표시
- 보유기간 3년(`INQUIRY_RETENTION_DAYS`) — 경과분 자동 파기 배치는 미구현

## 관리자 CMS

`/admin` 에서 원료·포트폴리오·게시물을 3개 국어로 직접 편집합니다.

| 화면 | 경로 |
|---|---|
| 대시보드 (문의 통계·유입 키워드) | `/admin` |
| 생산문의 목록·상세 | `/admin/inquiries` |
| 원료 | `/admin/ingredients` |
| 포트폴리오 | `/admin/portfolio` |
| 게시물 | `/admin/posts` |

- **부분 번역 허용**: 언어 탭에서 이름/제목을 비우면 그 언어의 번역 행을 만들지 않고,
  해당 언어 사이트에서도 노출되지 않습니다(목록에서 제외, 상세는 404).
  목록 화면의 `KO EN ZH` 표시로 어떤 언어가 채워졌는지 확인할 수 있습니다.
- **초안**: 게시물의 게시일을 비우면 초안으로 저장되어 공개되지 않습니다.
- 저장하면 관련 공개 페이지 캐시가 자동으로 무효화됩니다(아래 참고).

### 폼 작성 규칙 두 가지

**1. 서버 액션에 `.bind()`로 인자를 넘기지 말 것.**
바인딩된 인자는 암호화되어 전달되는데, JS 없는 폼 제출 경로에서 응답이
완결되지 않습니다. id는 `<input type="hidden" name="id">` 로 넘깁니다.

**2. form을 중첩하지 말 것.**
삭제 버튼은 저장 폼과 다른 액션을 쓰므로 별도 `<form>` 이 필요합니다.
저장 폼 **안에** 두면 중첩이 되어 제출 자체가 무시됩니다(에러도 나지 않습니다).
`DeleteButton` 은 저장 폼 바깥의 형제 요소로 렌더링합니다.

### 캐시 무효화

`revalidatePath("/[locale]/ingredients", "page")` 같은 **패턴 형태는 동작하지 않습니다** —
라우트가 route group `(site)` 안에 있어 매칭되지 않습니다.
`src/actions/content.ts` 는 로케일별 **리터럴 경로**로 무효화합니다.

```
/ko/ingredients, /en/ingredients, /zh/ingredients
/ko/ingredients/<slug>, …            ← slug 변경 시 이전 slug도 함께
/ko, /en, /zh                        ← 메인 노출 원료가 바뀔 수 있으므로
/sitemap.xml
```

## 이미지

원료 썸네일 · 게시물 커버 · 포트폴리오 이미지(최대 6장) · 인증 로고를
관리자에서 직접 업로드합니다. 이미지가 없는 항목은 이름 첫 글자를 딴
플레이스홀더로 대체되어 레이아웃이 무너지지 않습니다.

### 공개/비공개 네임스페이스

같은 스토리지를 쓰지만 접두사로 나눠, 라우트가 각자 자기 것만 내보냅니다.

| 접두사 | 용도 | 서빙 | 접근 |
|---|---|---|---|
| `inq/` | 문의 첨부 | `/api/files/<key>` | 관리자 세션 필수 |
| `pub/` | 콘텐츠 이미지 | `/api/media/<key>` | 공개, immutable 캐시 |

두 라우트 모두 상대 접두사를 검사합니다. 이 검사가 없으면 `/api/media/inq/...`
로 고객 첨부를 인증 없이 꺼낼 수 있습니다.

업로드는 `POST /api/admin/uploads`(관리자 전용, png·jpg·webp, 4MB)이며
`next/image` 최적화를 그대로 씁니다(webp 변환 + 반응형 리사이즈).

## 첨부파일

문의 폼에서 최대 3개, 파일당 5MB까지 첨부할 수 있습니다
(pdf · png · jpg · webp · docx · xlsx · hwp).

### 왜 Route Handler인가

Server Action은 본문이 **기본 1MB**로 제한됩니다(`serverActions.bodySizeLimit`).
이 값을 올리면 모든 액션에 적용되어 익명 폼의 DoS 표면이 커지므로,
파일만 `POST /api/uploads` 로 받고 액션에는 결과 메타데이터만 넘깁니다.

```
1. 브라우저 → POST /api/uploads (파일 1개씩)
2. 서버      → 검증 후 저장, { key, token, filename, size, mimeType } 반환
3. 브라우저 → 문의 제출 시 위 객체 배열을 함께 전송
4. 서버 액션 → token(HMAC) 검증 후 InquiryFile 생성
```

`token` 은 `AUTH_SECRET` 으로 서명한 key의 HMAC입니다. 이게 없으면
임의의 storage key를 남의 문의에 첨부로 붙일 수 있습니다.

### 검증

확장자 allowlist + 선언 MIME 일치 + **매직바이트 확인**을 모두 통과해야 합니다.
`.svg` 는 스크립트 실행이 가능해 허용하지 않습니다.

### 저장·열람

파일은 `public/` 바깥(`storage/uploads/`, `UPLOAD_DIR`)에 UUID 이름으로 저장하고,
원본 파일명은 DB에만 둡니다. 다운로드는 `/api/files/[...key]` 를 거치며

- 관리자 세션이 없으면 **404** (파일 존재 여부도 숨김)
- `InquiryFile` 행이 없는 키는 404 (고아 파일 열람 차단)
- 항상 `Content-Disposition: attachment` + `nosniff` (브라우저 렌더링 차단)
- 경로 탈출(`../`, 절대경로, 비ASCII)은 `resolveKey` 에서 차단

### 저장소 교체

`src/lib/storage/` 의 `StorageDriver` 인터페이스만 구현하면 됩니다.
현재는 `local` 만 있고, `STORAGE_DRIVER` 환경변수로 고릅니다.

> 로컬 드라이버는 빌드 시 "Dynamic filesystem access causes tracing of the
> whole project" 경고를 냅니다. 파일시스템을 쓰는 드라이버의 정상 동작이며,
> Blob/R2 드라이버로 바꾸면 사라집니다.

### 고아 파일 정리

업로드만 하고 제출하지 않으면 파일이 남습니다.

```bash
npm run storage:cleanup   # 24시간 경과 + DB 미참조 파일 삭제
```

운영에서는 하루 1회 크론으로 돌리세요.

## 다음 작업 (미구현)
1. 카카오 알림톡(솔라피) 발송 연동 — `.env` 항목만 준비됨
2. 개인정보 보유기간 경과 문의 자동 파기 크론 (첨부파일도 함께 삭제해야 함)
3. 다중 인스턴스 배포 시 레이트리미터를 Upstash Redis 등 공유 저장소로 교체
4. 문의 목록 엑셀 내보내기
5. EN/ZH 마케팅 카피 원어민 검수 (현재 번역은 개발자 작성본)
6. 정적 페이지 본문을 운영자가 직접 고치려면 `Page` 모델 추가 필요
   (현재는 메시지 카탈로그 수정 = 배포 필요)
