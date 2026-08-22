# Stitch 시안 — FASTLAB / 헬씨팜바이오

Stitch 프로젝트 `14174861727824112273` (30대 전문 라이프 플랫폼) 에서 내려받은 원본입니다.
`docs/design-brief.md` 를 입력으로 생성됐습니다.

## 화면

| 화면 | 디바이스 | 크기 | 이미지 | HTML |
|---|---|---|---|---|
| 홈페이지 - MODERN MFG | DESKTOP | 2560×2556 | `홈페이지-MODERN-MFG.png` | `홈페이지-MODERN-MFG.html` |
| 홈페이지 - 헬씨팜바이오 | DESKTOP | 2560×2556 | `홈페이지-헬씨팜바이오.png` | `홈페이지-헬씨팜바이오.html` |
| 보유 원료 목록 (모바일) | MOBILE | 780×4728 | `보유-원료-목록.png` | `보유-원료-목록.html` |
| 생산 문의 (모바일) | MOBILE | 780×4624 | `생산-문의.png` | `생산-문의.html` |
| 서비스 소개 - CDMO (모바일) | MOBILE | 780×5930 | `서비스-소개-CDMO.png` | `서비스-소개-CDMO.html` |
| 서비스 소개 - 완제품 OEM (모바일) | MOBILE | 780×6056 | `서비스-소개-완제품-OEM.png` | `서비스-소개-완제품-OEM.html` |
| 서비스 소개 - 원료 ODM (모바일) | MOBILE | 780×5866 | `서비스-소개-원료-ODM.png` | `서비스-소개-원료-ODM.html` |
| 커뮤니티 - 소식 (모바일) | MOBILE | 780×4992 | `커뮤니티-소식.png` | `커뮤니티-소식.html` |
| 헬씨팜바이오 - 홈 (모바일) | MOBILE | 780×1768 | `헬씨팜바이오-홈.png` | `헬씨팜바이오-홈.html` |
| 회사 소개 - 회사 개요 (모바일) | MOBILE | 780×6912 | `회사-소개-회사-개요.png` | `회사-소개-회사-개요.html` |
| design-brief.md | — | 780×1768 | — | `design-brief.md.html` |
| 헬씨팜바이오 파비콘 | — | 1024×1024 | `헬씨팜바이오-파비콘.png` | — |

## 디자인 시스템

| 이름 | assetId | 파일 |
|---|---|---|
| Efficient Trust | `87a8e84f71724997ae449f0e86788aab` | `DESIGN-SYSTEM-efficient-trust.md` |
| HealthyFarm Bio Trust System | `b8c6a9606a7d41ccabb6eed9ee1e6e2f` | `DESIGN-SYSTEM-healthyfarm-bio-trust-system.md` |

적용된 것은 **HealthyFarm Bio Trust System** 입니다 (의뢰서에 적은 `Design System` ID와 일치).

## 참고

- 브랜드 컬러가 의뢰서 값과 일치합니다: `#127a58`(메인), `#0d4032`(진한), `#f7f8f8`(섹션 배경), `#dcdee1`(테두리)
- HTML은 Stitch가 생성한 Tailwind CDN 기반 정적 마크업입니다. **그대로 쓰지 않고** 기존 컴포넌트(`src/components/site/*`)와 i18n·데이터 바인딩에 맞춰 이식해야 합니다.
- `헬씨팜바이오-홈 (모바일)` 은 780×1768 로 **히어로+숫자카드까지만** 있습니다. 나머지 섹션(서비스/원료/제형/인증/CTA)은 데스크톱 시안이나 추가 생성이 필요합니다.
- 원시 API 응답은 만료되는 서명 다운로드 URL을 포함해 커밋하지 않았습니다.

## 다시 받는 방법

```bash
# MCP 서버는 로컬 스코프에 등록돼 있습니다 (키는 저장소에 없음)
claude mcp list | grep stitch
```

MCP 도구는 세션 시작 시 로드되므로, 새 세션에서 `list_screens` / `get_screen` 을 쓰거나
`https://stitch.googleapis.com/mcp` 에 JSON-RPC 로 직접 호출하면 됩니다.
