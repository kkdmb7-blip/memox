# 규칙
- 작업 중 확인 질문 금지
- yes/no 절대 묻지 말 것
- 파일 수정/생성/삭제 모두 자동 승인
- 모르는 것 있어도 최선의 판단으로 진행
- 결과만 출력할 것
- 지시한 것만 실행할 것
- 모든 작업 완료 후 반드시 git commit + git push
- 코드 변경 시 APP_VERSION 올릴 것

---

# 코드 수정 전 필수 확인 체크리스트

## 데이터 흐름 확인
- 새 기능에서 **사용자 프로필 데이터**를 쓸 때: name, gender, birth_date, birth_time, birth_place 모두 넘기는지 확인
- AI 프롬프트를 새로 만들 때: 성별/생년월일/사주기둥 등 핵심 정보가 포함됐는지 확인
- 함수에 파라미터를 추가하면: 그 함수를 호출하는 모든 곳도 함께 수정

## 자주 발생하는 버그 패턴 (반드시 체크)
- **성별 누락**: AI 프롬프트, 사주 API 호출, 궁합 분석 등에서 gender가 빠지면 AI가 남성으로 가정함
- **월주 절기 미반영**: getMonthGanji() 호출 시 day 파라미터 반드시 전달 (미전달 시 절기 전/후 구분 안 됨)
- **사주 기둥 object→string 오류**: saju_pillars가 object일 수 있으므로 직접 문자열 결합 금지, 반드시 타입 체크
- **function 선언 호이스팅 무한재귀**: `var orig = fn; function fn() { orig() }` 패턴 절대 사용 금지 (호이스팅으로 무한재귀 발생)
- **display:none → display:flex**: flex 컨테이너를 show할 때 block이 아닌 flex로 설정
- **공유 버튼 미노출**: 결과 렌더링 함수 끝에 shareBtn display:flex 설정하는 코드 포함됐는지 확인

## 기능별 핵심 구조
### 채팅 AI 프롬프트 (sendMessage)
- saluteInfo에 성별/생년월일/사주기둥/신강신약/격국/용신 포함됨
- 모드별(사주/점성/자미두수/베딕) 데이터 블록 따로 구성

### 궁합 (openGunghapResultModal → requestGunghapAI)
- mySaju.gender = profile.gender 기반으로 설정 (M→남성, F→여성)
- pSaju.gender = 파트너 입력값 (M→남성, F→여성, 미선택→'')
- AI 프롬프트에 이름(성별) 형식으로 포함

### 공유 카드 (각 페이지 Canvas 2D)
- navigator.share({files:[file]}) → iOS
- navigator.clipboard.writeText() → URL 복사 fallback
- 버튼: 카카오노란색(#fee500) + AI보라색(linear-gradient #7b5ea7→#a07fd4), 동일 크기/스타일

### 월주 계산 (getMonthGanji)
- 반드시 day 파라미터 전달: getMonthGanji(year, month, day)
- 미래달은 15일 기준: getMonthGanji(fy, fmo, 15)

---

# 프로젝트 구조
- memox/index.html — 채팅 AI 앱 (포르투나)
- pico/ — 각종 운세 계산 페이지 (사주/점성/베딕/자미두수/기문둔갑)
- pico와 memox는 별도 git repo
