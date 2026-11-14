// 원본 데모(fan-demo.html)와 Next 호스트(src/components/room-screen.tsx) 사이 연결 스크립트.
// 메시지 규약·사용법은 docs/HANDOFF.md 참고. 화면 디자인은 원본 함수를 그대로 쓰고 상태만 주입한다.

// ---- 오늘의 5경기 (10팀). 룸 id = 경기 id. 점수는 20초=1이닝 시계에 따라 공개 ----
const MATCHES = [
  { id: 'm1', a: 6, b: 1, place: '사직', time: '18:30' },
  { id: 'm2', a: 0, b: 8, place: '잠실', time: '18:30' },
  { id: 'm3', a: 7, b: 3, place: '광주', time: '18:30' },
  { id: 'm4', a: 2, b: 9, place: '문학', time: '18:30' },
  { id: 'm5', a: 4, b: 5, place: '창원', time: '18:30' },
];
// 시나리오(내 팀 기준 최종 결과). 경기 시계에 맞춰 이닝별 득점이 공개됨
const SCENARIOS = {
  win:  { label: '이긴 경기', mine: [1,0,2,0,0,1,0,0,0], opp: [0,1,0,0,1,0,0,0,0] }, // 4:2
  lose: { label: '진 경기',   mine: [0,1,0,0,1,0,0,0,0], opp: [1,0,2,0,0,1,0,0,0] }, // 2:4
  draw: { label: '비긴 경기', mine: [0,2,0,0,0,1,0,0,0], opp: [0,0,0,3,0,0,0,0,0] }, // 3:3
};
const INNING_SEC = 20, PRAY_CLOSE_SEC = 100, GAME_END_SEC = 180, ACTION_GAP_MS = 250;
const STEP_SCREEN = ['home', 'match', 'pray', 'result', 'memorial'];

const initial = new URLSearchParams(location.search);
const screenParam = STEP_SCREEN.includes(initial.get('screen')) ? initial.get('screen') : 'home';
const roomParam = /^[a-zA-Z0-9_-]{1,40}$/.test(initial.get('room') || '') ? initial.get('room') : null;
const match = MATCHES.find((m) => m.id === roomParam) || null;
const inRoom = ['pray', 'result', 'memorial'].includes(screenParam) && !!roomParam;
const teamParam = Number(initial.get('team'));
let scenario = SCENARIOS[initial.get('result')] ? initial.get('result') : 'lose';
// 개인 응원팀(URL에 유지) vs 화면 기준팀(경기 양 팀 중 하나)
let fanTeam = Number.isInteger(teamParam) && teamParam >= 0 && teamParam < teams.length ? teamParam : (match ? match.a : 6);
let connected = false, sharedEnded = false, sharedClosed = false, navigating = false, lastActionAt = 0;

function tellParent(data) { parent.postMessage({ source: 'fan-demo', ...data }, location.origin); }
function navigate(screen, room) {
  if (navigating) return;
  navigating = true; setTimeout(() => (navigating = false), 1500);
  tellParent({ type: 'navigate', screen, room: room ?? roomParam, team: fanTeam, result: scenario });
}
function note(text) { $('connectionNote').textContent = text; $('connectionNote').style.display = text ? 'block' : 'none'; }

// ---- 화면 기준팀: 공통 경기는 같고, 내 팀이 이 경기에 있으면 내 팀 쪽에서 본다 ----
if (match) {
  const mine = fanTeam === match.a || fanTeam === match.b;
  state.myTeam = mine ? fanTeam : match.a;
  state.oppTeam = state.myTeam === match.a ? match.b : match.a;
  if (!mine && screenParam === 'pray') setTimeout(() => toast(`${teams[state.myTeam].name} 쪽에서 관전해요`), 600);
} else {
  state.myTeam = fanTeam; state.oppTeam = fanTeam === 1 ? 6 : 1;
}
syncTeams(); renderTeamGrid();
const baseSelectTeam = selectTeam;
selectTeam = function (i) { baseSelectTeam(i); fanTeam = i; };

function scoreAt(elapsed) {
  const done = Math.min(9, Math.floor(elapsed / INNING_SEC));
  const sum = (arr) => arr.slice(0, done).reduce((t, v) => t + v, 0);
  return { my: sum(SCENARIOS[scenario].mine), opp: sum(SCENARIOS[scenario].opp) };
}

// 초대 링크: 같은 경기 룸 주소 복사 (UI에서 필요하면 copyInvite(matchOf(fanTeam).id) 호출)
window.copyInvite = async function (id) {
  const url = `${location.origin}/pray?room=${id}`;
  try { await navigator.clipboard.writeText(url); toast('초대 링크를 복사했어요'); } catch { toast(url); }
};
const style = document.createElement('style');
style.textContent = `.scenario{margin-bottom:4px;grid-template-columns:repeat(3,1fr)}.scenario .ghostBtn{padding:12px 6px;font-size:13px}.scenario .on{background:#f6d38b;color:#17202e;border-color:#f6d38b}.logo{cursor:pointer}.connectionNote{display:none;cursor:pointer}`;
document.head.appendChild(style);

// ---- 이동: 모든 단계 전환은 URL 이동(새로고침·뒤로가기·직접 접속 대응) ----
const baseGo = go;
function matchOf(team) { return MATCHES.find((m) => m.a === team || m.b === team); }
go = function (step) {
  // STEP 02(경기 선택)는 쓰지 않음: 홈에서 '입장' → 내 팀의 고정 경기 룸으로 바로, 그 외에선 팀 선택으로
  if (step === 1) { navigate(screenParam === 'home' ? 'match' : 'home'); return; }
  const target = STEP_SCREEN[step];
  if (!target || target === screenParam) { baseGo(step); return; }
  if (target === 'memorial' && !sharedEnded) { toast('경기 종료 후 추모관이 열려요'); return; }
  navigate(target);
};
enterArena = function () { navigate('pray', matchOf(fanTeam).id); };
window.pickScenario = function (key) {
  scenario = key;
  document.querySelectorAll('#scenarioBtns button').forEach((b) => b.classList.toggle('on', b.dataset.s === key));
};
document.querySelector('.logo')?.addEventListener('click', () => navigate('home'));

// ---- 공유 행동: 연결 전·마감 후 차단, 연타 간격 제한 ----
function throttled() { const now = Date.now(); if (now - lastActionAt < ACTION_GAP_MS) return true; lastActionAt = now; return false; }
addForce = function (type) {
  if (!connected) { toast('경기장에 연결하는 중이에요'); return; }
  if (sharedClosed) { toast('기도 마감 · 경기 결과를 기다려요'); return; }
  if (throttled()) return;
  animateWeatherClick(type); showChant(type); tellParent({ type: 'action', action: type });
};
const baseSaveChant = saveChant;
saveChant = function (e) {
  if (!connected) { e.preventDefault(); toast('경기장에 연결하는 중이에요'); return; }
  if (sharedClosed) { e.preventDefault(); toast('기도 마감 · 한마디는 여기까지예요'); return; }
  baseSaveChant(e);
};
addTribute = function (message = '') {
  if (!connected) { toast('추모관에 연결하는 중이에요'); return; }
  if (!sharedEnded) { toast('경기 종료 후 함께 헌화해요'); return; }
  if (throttled()) return;
  tellParent({ type: 'action', action: 'flowers' });
  if (message) toast('꽃을 보냈어요 · 메시지는 이 기기에만 보여요');
};
clearTributes = function () { toast('함께 놓은 꽃은 지울 수 없어요'); };
changeScore = advanceInning = function () { toast('경기는 모두 같은 시계로 자동 진행돼요'); };
finishGame = function () { if (!sharedEnded) { toast('아직 경기가 진행 중이에요'); return; } navigate('result'); };
randomOpponent = function () { toast('대진은 경기 목록에서 골라요'); };
// 추모관 '초기화' → 같은 경기 룸에서 새 경기 시작 (종료 후에만 DB가 허용)
resetDemo = function () {
  if (!sharedEnded) { toast('경기가 끝난 뒤 새 경기를 시작할 수 있어요'); return; }
  if (navigating) return; navigating = true; setTimeout(() => (navigating = false), 2000);
  tellParent({ type: 'restart' });
};
document.querySelectorAll('#v4 .ghostBtn').forEach((b) => { if (b.textContent.trim() === '초기화') b.textContent = '새 경기'; });

// ---- 초기 화면 ----
const initialStep = STEP_SCREEN.indexOf(screenParam);
baseGo(initialStep);
if (initialStep === 1) {
  const m = matchOf(fanTeam);
  state.myTeam = fanTeam; state.oppTeam = m.a === fanTeam ? m.b : m.a; syncTeams();
  document.querySelector('#v1 .fixtureFoot').textContent = `${m.time} · ${m.place} 야구장 · LIVE`;
  pickScenario(scenario);
}
if (initialStep === 0) {
  const btn = document.querySelector('#v0 .fullBtn');
  if (btn) btn.textContent = '입장';
}
if (inRoom) {
  note('경기장에 연결하는 중…');
  $('rainAction').disabled = true; $('sunAction').disabled = true; $('tributeBtn').disabled = true;
  if (initialStep === 3) $('resultButton').disabled = true;
}
$('connectionNote').addEventListener('click', () => { if (inRoom) { note('다시 연결하는 중…'); tellParent({ type: 'retry' }); } });

// ---- 호스트 → 데모: 공유 상태 반영 ----
window.addEventListener('message', (event) => {
  if (event.origin !== location.origin || event.source !== parent || event.data?.source !== 'fan-host') return;
  const m = event.data;
  if (m.type === 'error') { connected = false; note(`${m.message} (눌러서 다시 시도)`); return; }
  if (m.type !== 'state' || !m.room) return;
  applyRoom(m.room, m.restarted);
});
let lastRoomState = null;
setInterval(() => {
  if (!lastRoomState) return;
  const e = (Date.now() - Date.parse(lastRoomState.started_at)) / 1000;
  const inning = Math.min(9, Math.floor(e / INNING_SEC) + 1);
  if (e >= PRAY_CLOSE_SEC !== sharedClosed || e >= GAME_END_SEC !== sharedEnded || (state.step === 2 && inning !== state.inning)) applyRoom(lastRoomState, false);
}, 1000);
function applyRoom(r, restarted) {
  lastRoomState = r;
  connected = true; note('');
  const elapsed = Math.max(0, (Date.now() - Date.parse(r.started_at)) / 1000);
  sharedClosed = elapsed >= PRAY_CLOSE_SEC; sharedEnded = elapsed >= GAME_END_SEC;
  if (restarted) { toast('이 경기장에서 새 경기가 시작됐어요'); if (state.step >= 3) { navigate('pray'); return; } }

  state.tears = r.rain; state.suns = r.sun;
  state.inning = Math.min(9, Math.floor(elapsed / INNING_SEC) + 1); state.half = '말';
  { const sc = scoreAt(sharedEnded ? GAME_END_SEC : elapsed); state.myScore = sc.my; state.oppScore = sc.opp; }

  renderArena();
  $('rainAction').disabled = sharedClosed; $('sunAction').disabled = sharedClosed;
  document.querySelector('.chantToggle').disabled = sharedClosed;
  if (sharedClosed) $('chantComposer').classList.add('hidden');
  if (sharedClosed) $('roleText').textContent = sharedEnded ? '경기 종료 · 오늘도 함께였어요' : '5회 성립 · 이제 비가 와도 집니다';
  $('inningTag').textContent = sharedEnded ? '경기 종료' : `${state.inning}회 말 · LIVE`;

  state.tributes = Array.from({ length: Math.min(r.flowers, 300) }, (_, i) => ({ x: 8 + ((i * .61803398875) % 1) * 77, y: Math.min(78, 10 + Math.floor(i / 9) * 11 + (i * 7) % 15), size: .68 + (i % 9) * .05, rotation: -53 + (i * 29) % 107, seed: i * 7.31, message: '' }));
  state.flowers = r.flowers;
  $('tributeBtn').disabled = !sharedEnded;

  if (state.step === 3) {
    renderResult();
    $('resultButton').disabled = !sharedEnded;
    if (!sharedEnded) { $('resultTitle').textContent = '아직 끝나지 않았어요'; $('resultDesc').textContent = `${state.inning}회 진행 중 · 9회 종료 후 결과가 확정됩니다.`; }
  }
  if (state.step === 4) { if (!sharedEnded) { navigate('result'); return; } renderEnding(); }
  if (sharedEnded && state.step === 2) navigate('result');
}
tellParent({ type: 'ready' });
