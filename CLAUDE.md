모든 작업 완료 후 반드시 git commit하고 git push까지 자동으로 해줘

---

# 포르투나 (Fortuna) 프로젝트 현황 — 2026-03-19

## 프로젝트 개요
- **서비스명**: 포르투나 — AI 운세/사주 PWA 채팅앱
- **GitHub Pages**: https://kkdmb7-blip.github.io/memox/
- **레포**: `memox` (프론트), `fortuna` (Vercel API)
- **DB**: Supabase (`ymghmfkqctckxxysxkvy`)

---

## 주요 파일 위치

| 파일 | 설명 |
|------|------|
| `index.html` | 메인 앱 전체 (HTML/CSS/JS 단일 파일, ~2MB) |
| `sw.js` | Service Worker (오프라인 캐시, Background Sync) |
| `manifest.json` | PWA 매니페스트 |
| `icon.svg` | 앱 아이콘 |

---

## API 엔드포인트

| 엔드포인트 | 용도 |
|-----------|------|
| `https://fortuna-silk.vercel.app/api/chat` | Claude Haiku AI 채팅 (POST: `{user_id, messages, system_prompt}` → `{reply, free_left, paid_left}`) |
| `https://fortuna.kkdmb7.workers.dev/saju` | 사주팔자 계산 |
| `https://fortuna.kkdmb7.workers.dev/ziwei` | 자미두수 (iztro 라이브러리) |
| `https://fortuna.kkdmb7.workers.dev/astro` | 서양 점성술 |
| `https://fortuna.kkdmb7.workers.dev/astro/aspects` | 행성 각도 |
| `https://fortuna.kkdmb7.workers.dev/kakao-token` | 카카오 공유 토큰 |
| `https://fortuna.kkdmb7.workers.dev/chat` | AI 채팅 fallback 프록시 |
| Supabase | 사용자 인증, 프로필, 채팅 기록, 운세 적중 기록 |

---

## 완료된 작업

### 핵심 기능
- [x] 사주팔자 분석 (생년월일시 기반)
- [x] 자미두수 — iztro 연동 (`palace.earthlyBranch === chart.earthlyBranchOfSoulPalace`로 soul palace 판별)
- [x] 서양 점성술 — 행성 위치 & 각도
- [x] 감정 트래킹 / 관심사 설정 / 운세 적중 기록
- [x] 데일리 카드 — 로컬 사주 데이터로 생성 (Gemini API 불필요)
- [x] 타로 카드 78장 — Rider-Waite Wikimedia 퍼블릭도메인 이미지
  - 원카드 / 쓰리카드 스프레드
  - 역방향 카드: CSS `transform: rotate(180deg)`
  - 이미지 로드 실패 시 컬러 fallback
  - AI 해석: 직접 `fetch` (30초 타임아웃, callClaude 미사용)
- [x] 결제 — inicis 연동

### UI/UX
- [x] 말풍선 우하단 아이콘 버튼 — 복사(SVG) + 🎯 맞았어요
  - hover 시 표시, 모바일 항상 표시 (`@media (hover:none)`)
- [x] 입력창 단순화 — `[textarea][🃏 타로][💫 전송]` 2버튼
- [x] 헤더에 ✨리포트 + 💬카카오 버튼 배치
- [x] 채팅창 하단 배너 제거
- [x] 로그인 여신 이미지 — 130px 원형 (`border-radius:50%; object-fit:cover`)
- [x] **전역 버튼 active 효과** — `button:active:not(:disabled)` scale 축소 + opacity

### 버그픽스
- [x] `[CTX]...[/CTX]` 정규식 오류 → AI 내부 맥락 블록이 화면에 출력되던 문제 수정
- [x] `맞았어요` / `적중 일지` 버튼 — `window._fortunaUser` 미설정 → `currentUser`로 수정
- [x] 전송 버튼 텍스트 '운명 열기' → '전송'으로 통일
- [x] `callGemini()` → `callClaude()` 전체 rename
- [x] JS 문자열 내 리터럴 개행 수정 (여러 함수)
- [x] SW 캐시 오류 — `addAll()` → `Promise.allSettled` + 개별 catch
- [x] SW 경로 — GitHub Pages `/memox/` 서브패스 대응

---

## 현재 진행 중
- 없음

## 다음 작업 후보
- 타로 카드 결과 저장/공유 기능
- 운세 히스토리 페이지 개선
- 푸시 알림 (데일리 카드 알림)
- 다국어 지원

---

## 개발 시 주의사항

### index.html 수정 방법
- 파일 크기 ~2MB → 큰 블록 교체 시 Edit 도구 실패 가능
- 실패 시: `C:/tmp/patch_xxx.js` 파일로 node.js 패치 스크립트 작성
  ```js
  const fs = require('fs');
  let c = fs.readFileSync('C:/Users/차니파파/Desktop/memox/index.html', 'utf8');
  const idx = c.indexOf('앵커 문자열');
  c = c.slice(0, idx) + 새내용 + c.slice(idx + 구내용.length);
  fs.writeFileSync('...index.html', c, 'utf8');
  ```
- CRLF 주의: index.html 혼용 (`\r\n`). 앵커에 포함 필요할 수 있음
- `node -e` 금지: backslash 이중 이스케이프 문제 → 반드시 .js 파일로 작성
- 수정 후 JS syntax 검증 필수:
  ```bash
  node -e "const fs=require('fs'),c=fs.readFileSync('index.html','utf8'); const s=c.indexOf('<script>'),e=c.lastIndexOf('</script>'); require('fs').writeFileSync('/tmp/t.js',c.slice(s+8,e),'utf8');" && node --check /tmp/t.js
  ```

### 주요 변수/패턴
- 로그인 사용자: `currentUser` (Supabase auth), `userProfile` (DB 프로필)
- AI 채팅: `callClaude(message)` — 스트리밍, 채팅 버블 생성 (타로 해석엔 직접 fetch 사용)
- 맥락 저장: `window._fortunaUserCtx` — `extractAndSaveContext()`로 갱신
