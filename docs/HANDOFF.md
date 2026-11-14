# 비라도 와라 — 인수인계

## 실행
```
cp .env.example .env.local
pnpm install
pnpm dev
```
main에 push하면 Vercel이 자동 배포 → https://jeckathon-4.vercel.app (push 전 `git pull` 필수)

## 서비스 플로우
팀 선택(`/`) → 입장 → **내 팀의 고정 경기 카드 + 시나리오(이긴/진/비긴 경기) 선택**(`/?screen=match&team=6`)
→ 경기장 입장(`/pray?room=m1&team=6&result=lose`)
→ 5회(100초) 기도 마감 → 9회(180초) 종료 시 자동으로 결과(`/result`) → 추모관(`/memorial`)
→ 추모관의 `새 경기`(같은 룸 재시작) 또는 `다른 경기`(팀 선택으로)

- 모든 이동은 URL로 처리 → 새로고침·직접 접속·브라우저 뒤로가기 대응. `room`, `team`은 항상 URL에 유지
- `room` 없이 `/pray` 등에 직접 오면 팀 선택으로 리다이렉트
- 종료된 룸의 기도관에 들어오면 결과 화면으로 자동 이동. 종료 전 추모관 접근 시 결과 화면으로
- 헤더 로고 클릭 = 메인(팀 선택)

## 오늘의 5경기 (고정, `public/room-bridge.js`의 `MATCHES`)
| 룸 | 대진 | 구장 |
|---|---|---|
| m1 | 롯데 vs 한화 | 사직 |
| m2 | LG vs 두산 | 잠실 |
| m3 | KIA vs 삼성 | 광주 |
| m4 | SSG vs 키움 | 문학 |
| m5 | NC vs KT | 창원 |

- 룸 공통: 대진, 경기 시계(이닝·단계), 비·해·헌화 수. 개인: 응원팀(URL `team`), 시나리오(URL `result`)
- 시나리오는 내 팀 기준 최종 점수(이긴 4:2, 진 2:4, 비긴 3:3). 20초=1이닝 시계에 따라 이닝별 득점 공개
- 결과 화면·추모관 연출(패배 추모관/승리 클럽/무승부)은 시나리오에 따라 갈림
- 초대 링크: `https://jeckathon-4.vercel.app/pray?room=m1` (team 없으면 홈팀 기준)

## DB (Supabase)
- `supabase/001_rooms.sql`: 테이블 `fan_rooms`, `join_fan_room`, `act_in_fan_room`, RLS, Realtime (적용 완료)
- `supabase/002_match_rooms.sql`: 고정 룸 재사용. 시작 240초(종료+60초) 지난 룸에 입장하면 새 경기, `restart_fan_room`은 종료 후에만 리셋
- 규칙: 20초=1이닝, 100초 기도 마감(비·해 무시), 180초 종료(헌화 허용). 시간 밖 행동은 DB가 무시
- 브라우저에서 테이블 직접 쓰기 불가. 쓰기는 RPC로만

## 공용 함수 (`src/lib/room.ts`)
| 함수 | 용도 |
|---|---|
| `joinRoom(id)` | 기도관 입장. 없으면 생성, 오래 끝난 룸이면 새 경기 |
| `getRoom(id)` | 읽기 전용 재조회 (주기 동기화용, 리셋 안 일으킴) |
| `actInRoom(id, 'rain'\|'sun'\|'flowers')` | 비·해·헌화 +1 |
| `restartRoom(id)` | 종료 후 새 경기 |
| `subscribeRoom(id, cb)` | 실시간 수신. 반환 함수로 해제 |

## iframe 메시지 규약 (`room-screen.tsx` ↔ `public/room-bridge.js`)
데모 → 호스트 (`source: 'fan-demo'`)
- `{type:'ready'}` 로드 완료
- `{type:'navigate', screen:'home'|'pray'|'result'|'memorial', room, team}` 화면 이동
- `{type:'action', action:'rain'|'sun'|'flowers'}` 공유 행동
- `{type:'restart'}` 같은 룸 새 경기
- `{type:'retry'}` 연결 재시도

호스트 → 데모 (`source: 'fan-host'`)
- `{type:'state', room, restarted}` 공유 상태 (실시간 + 3초 재조회)
- `{type:'error', message}` 연결 오류 (안내 띠를 누르면 재시도)

기도관·추모관 담당은 연출만 원본 HTML 함수에서 고치고, 공유 데이터는 위 메시지로만 주고받으면 됩니다.
버튼 연타는 250ms 간격으로 제한, 연결 전·마감 후에는 버튼 비활성.

## 실시간인 것 / 로컬 연출인 것
- 실시간 공유: 비·해 합계, 경기 시계(이닝·점수·단계), 헌화 수
- 이 기기에만 보이는 연출(미구현): 방명록, 응원 한마디, 헌화 메시지, 묵념·담배·폭죽·댄서
