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
- **모바일 홈은 3개 화면으로 나뉘어 있습니다.** 한 번에 생성하면 Gemini 출력 한도에 걸려 중간에서 잘립니다.

  | 파일 | 범위 | 크기 |
  |---|---|---|
  | `헬씨팜바이오-홈-full` | 헤더 · 히어로 · 숫자카드 · 서비스 5종 | 780×2844 |
  | `헬씨팜바이오-홈-하단` | HOT 원료 · 제형/포장 · 인증(다크) · Priority Service | 780×4356 |
  | `헬씨팜바이오-홈-푸터` | 최근 문의 · 최종 CTA · 푸터 · 하단 고정바 | 780×3174 |

  구현 시에는 이 셋을 이어 붙인 하나의 페이지입니다. (`헬씨팜바이오-홈.png` 780×1768 은 최초 시안으로, 참고용으로만 남겨둡니다.)
- `edit_screens` 로 기존 화면을 수정하면 응답은 성공하지만 **프로젝트 화면에는 반영되지 않습니다**(Stitch UI에서 수락해야 함). 새 화면을 만드는 `generate_screen_from_text` 를 쓰세요.
- 프롬프트가 약 3,900자를 넘으면 `Request contains an invalid argument` 로 실패합니다. 800~1,200자 단위로 나누세요.
- 원시 API 응답은 만료되는 서명 다운로드 URL을 포함해 커밋하지 않았습니다.

## 다시 받는 방법

```bash
# MCP 서버는 로컬 스코프에 등록돼 있습니다 (키는 저장소에 없음)
claude mcp list | grep stitch
```

MCP 도구는 세션 시작 시 로드되므로, 새 세션에서 `list_screens` / `get_screen` 을 쓰거나
`https://stitch.googleapis.com/mcp` 에 JSON-RPC 로 직접 호출하면 됩니다.
