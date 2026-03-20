모든 작업 완료 후 반드시 git commit하고 git push까지 자동으로 해줘

---

# 포르투나 (Fortuna) 프로젝트 현황 — 2026-03-20

## 프로젝트 개요
- **서비스명**: 포르투나 — AI 운세/사주 PWA 채팅앱
- **GitHub Pages**: https://kkdmb7-blip.github.io/memox/
- **레포**: `memox` (프론트), `fortuna` (Vercel API)
- **DB**: Supabase (`ymghmfkqctckxxysxkvy`)
- **현재 버전**: APP_VERSION `2.13.0` / CACHE_NAME `fortuna-cache-2.13.0` (고정)
- **버전 정책**: 배포 시 APP_VERSION만 올림. CACHE_NAME은 sw.js 로직 자체가 바뀔 때만 변경. (index.html은 네트워크 우선 전략이라 캐시 무효화 불필요)

---

## 주요 파일 위치

### memox 레포 (프론트)
| 파일 | 설명 |
|------|------|
| `index.html` | 메인 앱 전체 (HTML/CSS/JS 단일 파일, ~2MB) |
| `sw.js` | Service Worker (오프라인 캐시, Background Sync, Push) |
| `manifest.json` | PWA 매니페스트 |
| `icon.svg` | 앱 아이콘 |

### fortuna 레포 (Vercel API)
| 파일 | 설명 |
|------|------|
| `api/chat.js` | Claude Haiku AI 채팅 (메인) |
| `api/push.js` | Web Push 발송 (Cron, 매일 KST 07:30) |
| `api/horoscope.js` | 운세 관련 |
| `api/inicis-sign.js` / `api/inicis-result.js` | 결제 (inicis) |
| `vercel.json` | CORS 헤더 + Cron 설정 |

---

## API 엔드포인트

| 엔드포인트 | 용도 |
|-----------|------|
| `https://fortuna-silk.vercel.app/api/chat` | Claude AI 채팅 (POST: `{user_id, messages, system_prompt}` → `{reply, free_left, paid_left}`) |
| `https://fortuna-silk.vercel.app/api/push` | Web Push 발송 (Cron 자동 호출, CRON_SECRET 인증) |
| `https://fortuna.kkdmb7.workers.dev/saju` | 사주팔자 계산 |
| `https://fortuna.kkdmb7.workers.dev/ziwei` | 자미두수 (iztro 라이브러리) |
| `https://fortuna.kkdmb7.workers.dev/astro` | 서양 점성술 |
| `https://fortuna.kkdmb7.workers.dev/astro/aspects` | 행성 각도 |
| `https://fortuna.kkdmb7.workers.dev/kakao-token` | 카카오 공유 토큰 |
| `https://fortuna.kkdmb7.workers.dev/chat` | AI 채팅 fallback 프록시 |
| Supabase | 사용자 인증, 프로필, 채팅 기록, 운세 적중 기록, push_subscriptions |

---

## 중요 설정값

| 항목 | 값 |
|------|-----|
| VAPID 공개키 | `BOZ_WFR7WctHK5NiBggYq4cE07WNEMYp8tlv_2L99m6e-IKx6_K5UoVEV2jf06X2FshL43qogZvnSfRWEOmpP5M` |
| Push Cron | UTC 22:30 (= KST 07:30) 매일 |
| Supabase 프로젝트 | `ymghmfkqctckxxysxkvy` |
| SW 스코프 | `/memox/` (GitHub Pages 서브패스) |

---

## 완료된 작업

### 핵심 기능
- [x] 사주팔자 분석 (생년월일시 기반)
- [x] 자미두수 — iztro 연동 (`palace.earthlyBranch === chart.earthlyBranchOfSoulPalace`로 soul palace 판별)
- [x] 서양 점성술 — 행성 위치 & 각도
- [x] 베딕 점성술 — 라시/라그나/나크샤트라/다샤 (callClaude 시스템 프롬프트 포함)
- [x] 감정 트래킹 / 관심사 설정 / 운세 적중 기록
- [x] 데일리 카드 — 로컬 사주 데이터로 생성 (외부 API 불필요)
- [x] 타로 카드 78장 — Rider-Waite Wikimedia 퍼블릭도메인 이미지
  - 원카드 / 쓰리카드 스프레드
  - 78장 전체 노출 (6열 그리드, max-height:55vh 스크롤)
  - 역방향 카드: CSS `transform: rotate(180deg)`
  - 이미지 로드 실패 시 컬러 fallback
  - AI 해석: 직접 `fetch` (30초 타임아웃, callClaude 미사용)
  - 대기 메시지 4단계 페이드 애니메이션
  - 카드 키워드 포함 (cardLines에 keywords 추가)
  - 프롬프트: ①전체흐름 ②카드별 ③별자리 ④행동제안 구조
- [x] 결제 — inicis 연동
- [x] Web Push 알림 시스템
  - VAPID 키 상수 (`const VAPID_PUBLIC_KEY`)
  - `subscribePush()` → Supabase `push_subscriptions` 저장
  - `allowNotification()` / `requestNotification()` 연동
  - sw.js push / notificationclick 핸들러
  - fortuna `api/push.js` + vercel.json Cron

### 시스템 프롬프트 (callClaude)
- [x] 질문 유형별 2개 시스템 조합 (단기/중기/장기/성격/타이밍)
- [x] 일진/월건 절대 규칙 (`【절대 규칙 - 반드시 준수】 ⚠️`)
- [x] 향후 60일 일진 + 6개월 월건 표 포함
- [x] 자미두수/베딕 데이터 블록 포함
- [x] 답변 구조: ①공감 → ②사주/점성 근거 → ③현실 연결 → ④행동 한 줄
- [x] [CARD] / [CTX] 태그 시스템
- [x] 좋은 답변 예시 2개 포함

### UI/UX
- [x] 말풍선 우하단 아이콘 버튼 — 복사(SVG) + 🎯 맞았어요
  - hover 시 표시, 모바일 항상 표시 (`@media (hover:none)`)
- [x] 입력창: `[textarea][🃏 타로][💫 전송]` 2버튼
- [x] 헤더: ✨리포트 + 💬카카오 버튼
- [x] 햄버거 메뉴(☰) — `.settings-dropdown` position:fixed, z-index:9999 (overflow:hidden 이슈 해결)
- [x] 채팅창 하단 배너 제거
- [x] 로그인 여신 이미지 — 130px 원형 (`border-radius:50%; object-fit:cover`)
- [x] 전역 버튼 active 효과 — `button:active:not(:disabled)` scale 축소 + opacity

### 버그픽스
- [x] Google 로그인 무한루프 — `onAuthStateChange` 리스너를 `getSession()` 전에 등록, `_authHandled` 플래그
- [x] 뒤로가기 버튼 로그아웃 — `history.pushState` + `popstate` 핸들러로 방지
- [x] 답변 안 오는 버그 (v2.1.0)
  - apiKey 게이트 제거 (Vercel API는 gemini_key 미사용 — 레거시 Gemini 잔재)
  - 30초 타임아웃 + AbortController
  - 자동 재시도 1회 (2초 후)
- [x] 카운트 차감 타이밍 — `interpretTarotWithAI`: 성공 후에만 차감 (오류/타임아웃 시 차감 안 함)
- [x] `[CTX]...[/CTX]` 정규식 — AI 내부 맥락 블록 화면 출력 방지
- [x] `맞았어요` 버튼 — `window._fortunaUser` → `currentUser`로 수정
- [x] `callGemini()` → `callClaude()` 전체 rename
- [x] SW 캐시 오류 — `addAll()` → `Promise.allSettled` + 개별 catch
- [x] SW 경로 — GitHub Pages `/memox/` 서브패스 대응

---

## 현재 진행 중
- 없음

## 다음 작업 후보
- 타로 카드 결과 저장/공유 기능
- 운세 히스토리 페이지 개선
- Push 알림 테스트 및 고도화 (현재 Cron 구현 완료, 실 발송 검증 필요)
- 다국어 지원

---

## 개발 시 주의사항

### index.html 수정 방법
- 파일 크기 ~2MB → 큰 블록 교체 시 Edit 도구 실패 가능
- 실패 시: `C:/tmp/patch_xxx.js` 파일로 Node.js 패치 스크립트 작성 후 실행
  ```js
  const fs = require('fs');
  let c = fs.readFileSync('C:/Users/차니파파/Desktop/memox/index.html', 'utf8');
  const hasCRLF = c.includes('\r\n');
  c = c.replace(/\r\n/g, '\n');           // CRLF → LF 정규화 (필수)
  // ... 수정 ...
  if (hasCRLF) c = c.replace(/\n/g, '\r\n'); // 복원
  fs.writeFileSync('...index.html', c, 'utf8');
  ```
- **CRLF 주의**: index.html 혼용(`\r\n`). 패치 전 반드시 LF 정규화할 것
- **`node -e` 금지**: Windows 한국어 경로 + backslash 이중 이스케이프 문제 → 반드시 `.js` 파일로 저장 후 실행
- **패치 스크립트 문자열**: 한국어를 `\uXXXX` 유니코드 이스케이프로 쓰면 안 됨 → 실제 한국어 텍스트로 작성
- 수정 후 JS syntax 검증 필수:
  ```bash
  node -e "const fs=require('fs'),c=fs.readFileSync('index.html','utf8'); const s=c.indexOf('<script>'),e=c.lastIndexOf('</script>'); require('fs').writeFileSync('C:/tmp/t.js',c.slice(s+8,e),'utf8');" && node --check C:/tmp/t.js && echo "JS syntax OK"
  ```

### 주요 변수/패턴
- 로그인 사용자: `currentUser` (Supabase auth), `userProfile` (DB 프로필)
- AI 채팅: `callClaude(userMsg, apiKey)` — 버블 직접 생성 후 `cleanReply` 반환 (타로 해석엔 직접 fetch 사용)
- 카운트 관리: `useQuestion()` — 성공 후에만 호출, `_questionCountCache` 로컬 캐시
- 맥락 저장: `window._fortunaUserCtx` — `extractAndSaveContext()`로 갱신
- 타임아웃: `callClaude` 30초 AbortController + 1회 자동 재시도
- apiKey: `userProfile.gemini_key` 또는 localStorage `memox_gemini_key` — Vercel API 미사용, 레거시 필드
