# 규칙
- 작업 중 확인 질문 금지
- yes/no 절대 묻지 말 것
- 파일 수정/생성/삭제 모두 자동 승인
- 모르는 것 있어도 최선의 판단으로 진행
- 결과만 출력할 것
- 지시한 것만 실행할 것
- 모든 작업 완료 후 반드시 git commit + git push
- 코드 변경 시 APP_VERSION 올릴 것 (파일 상단 const APP_VERSION)

---

# 프로젝트 개요

**서비스명**: FORTUNA (AI 운세 채팅)
**URL**: https://kkdmb7-blip.github.io/memox/
**Git**: https://github.com/kkdmb7-blip/memox
**스택**: 순수 HTML/JS (단일 파일), Supabase, Google Gemini, Kakao SDK
**단일 파일**: `index.html` (7,600줄 이상)

## 인프라

| 항목 | 값 |
|---|---|
| Supabase URL | https://ymghmfkqctckxxysxkvy.supabase.co |
| Supabase Key | sb_publishable_3-9zobXqx6Nv36LzmNMBpA_fohZqA5x |
| AI Proxy | https://fortuna-silk.vercel.app |
| Kakao REST Key | 0c8f16db31d8b01ae2fc9cc2c7c56ea7 |

## API 엔드포인트 (fortuna-silk.vercel.app)

| 경로 | 메서드 | 설명 |
|---|---|---|
| /api/chat | POST | AI 채팅 (Anthropic Claude) |
| /api/daily-fortune | GET | 일운세 생성 |
| /api/messages | GET | 메시지 조회 |
| /api/save-context | POST | 상담 컨텍스트 저장 |
| /api/save-profile | POST | 프로필 저장 |
| /api/resolve-user | POST | 사용자 resolve |
| /api/push | POST | 웹 푸시 발송 |

## Supabase 테이블

| 테이블 | 주요 필드 | 설명 |
|---|---|---|
| chat_users | id, kakao_id, google_id, name, gender, birth_date, birth_time | 사용자 |
| chat_messages | user_id, role, content, mode, created_at | 대화 메시지 |
| user_context | user_id, saju_data, astro_data, vedic_data, ziwei_data | AI 프롬프트용 컨텍스트 |
| user_streaks | user_id, streak_count, last_visit | 연속 방문일 |
| orb_balance | user_id, balance, paid_balance | Orb 잔액 |
| orb_transactions | user_id, amount, type, description | Orb 내역 |
| question_charges | user_id, question_count, charged_at | 질문 과금 |
| push_subscriptions | user_id, endpoint, keys | 웹 푸시 구독 |
| daily_fortune | user_id, date, content | 일운세 캐시 |
| knowledge_docs | title, category, tags, importance, content | AI 학습 지식 |

**Orb 규칙**: balance + paid_balance 반드시 동시 업데이트. paid_balance 빠지면 음수 버그.

## localStorage 키

| 키 | 내용 |
|---|---|
| pico_user / fortuna_kakao_user | {id, name, avatar} 로그인 유저 |
| memox_profile | 현재 프로필 |

---

# 핵심 기능 구조

## 채팅 AI 흐름 (sendMessage)
1. 사용자 입력 → saluteInfo 구성 (성별/생년월일/사주기둥/신강신약/격국/용신)
2. 모드별 데이터 블록 추가 (사주/점성/자미두수/베딕)
3. POST /api/chat → 스트리밍 응답
4. 메시지 Supabase 저장

## 궁합 (openGunghapResultModal → requestGunghapAI)
- mySaju.gender = profile.gender 기반 (M/F)
- pSaju.gender = 파트너 입력값
- AI 프롬프트에 이름(성별) 형식으로 포함

## 온보딩 (3단계)
1. 기본 정보 (이름/성별)
2. 사주 입력 (생년월일/시간)
3. 별자리 입력 (출생지)

## 공유 카드
- navigator.share({files:[file]}) → iOS
- navigator.clipboard.writeText() → URL 복사 fallback
- 버튼: 카카오(#fee500) + AI(linear-gradient #7b5ea7→#a07fd4)

---

# 코드 수정 전 필수 확인 체크리스트

## 데이터 구조 확인 규칙 (필수)
- API 응답, localStorage, Supabase 필드: **절대 추측 금지**
- 불확실할 때 작업 전 사용자에게 샘플 데이터 요청
- 사례: saju_data.pillars.day → 실제는 saju_data.saju_pillars 문자열

## 데이터 흐름 확인
- 사용자 프로필 데이터 사용 시: name, gender, birth_date, birth_time, birth_place 모두 전달 확인
- AI 프롬프트 새로 만들 때: 성별/생년월일/사주기둥 포함 확인
- 함수에 파라미터 추가 시: 호출하는 모든 곳도 함께 수정

## 자주 발생하는 버그 패턴

- **성별 누락**: AI 프롬프트/사주 API/궁합에서 gender 빠지면 AI가 남성으로 가정
- **월주 절기 미반영**: getMonthGanji(year, month, day) — day 반드시 전달
- **사주 기둥 타입 오류**: saju_pillars가 object일 수 있음, 직접 문자열 결합 금지
- **function 선언 호이스팅 무한재귀**: `var orig = fn; function fn() { orig() }` 절대 금지
- **display:none → display:flex**: flex 컨테이너는 block 아닌 flex로 show
- **코드 삽입 위치 오류**: 함수 내부 추가 시 닫는 } 위치 반드시 확인
