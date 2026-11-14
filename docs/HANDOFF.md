# 비라도 와라 — 기본 세팅

## 실행
pnpm install / pnpm dev. `.env.local`은 `.env.example`을 참고. Vercel에도 동일한 NEXT_PUBLIC 환경변수가 필요합니다.

## 서버 연결 필수 단계
Supabase SQL Editor에서 `supabase/001_rooms.sql` 실행. 브라우저는 publishable key만 사용합니다. Supabase가 DB와 Realtime 서버입니다. 별도 상주 서버는 필요하지 않습니다.
같은 room 쿼리값을 사용하면 동일한 데이터를 봅니다. 구독 + 3초 재조회로 복구합니다. 실제 원격 SQL 적용 및 다중 기기 검증은 별도로 필요합니다.

## 담당
- 공통 담당: src/lib, src/components, globals.css, 입장 및 결과
- 기도관 담당: src/app/pray (현재 RoomScreen 기본 구현을 참고해 담당 폴더로 화면 구현)
- 추모관 담당: src/app/memorial (동일)
- 공용 파일 수정 필요 시 공통 담당자에게 요청

## 디자인
globals.css의 CSS 변수 사용. 색상 직접 추가 금지. `Shell`, `Button`, `Stadium`은 components/game-ui.tsx. 모바일 우선, PC 최대 640px 중앙 배치.

## 데이터 계약
lib/room.ts의 joinRoom, subscribeRoom, actInRoom 사용. roomId를 모든 링크에 유지.
Room: id, started_at, rain, sun, flowers. DB 원자 증가 사용.
20초마다 1회 진행, 100초에 기도 마감, 180초에 종료 및 헌화 허용. 경기 점수는 기본 시나리오 롯데 2 : 한화 4.
새 시연은 새로운 룸 이름 사용. 기존 룸은 초기화하지 않음.

## 후속 기능
팀별 승패 화면, 방명록 저장, 묵념 이벤트, 클릭 이펙트, 접속자 수는 후속 구현 대상입니다. 팀 선택은 현재 브라우저에 저장만 됩니다.

## 검증
두 기기에서 같은 room으로 입장 → 비 합산 확인 → 새로고침 복원 → 5회 마감 → 경기 종료 후 헌화 공유. 다른 room은 분리되어야 합니다.
push 전 git pull 필수.
