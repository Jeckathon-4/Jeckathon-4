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
  win:  { label: '이긴 경기', title: '☀️ 4 : 2 · 이기는 날', lines: ['우리 팀이 리드 중. 해를 눌러 맑은 하늘을 지키세요.', '상대 팬은 비를 눌러 우천취소를 빌어요. 더 많이 누른 쪽으로 하늘이 바뀝니다.', '경기가 끝나면 승리 클럽. 댄서를 부르고 화면을 눌러 폭죽을 터뜨려요.'], mine: [1,0,2,0,0,1,0,0,0], opp: [0,1,0,0,1,0,0,0,0] }, // 4:2
  lose: { label: '진 경기', title: '💧 2 : 4 · 지는 날', lines: ['우리 팀이 끌려가는 중. 비를 눌러 우천취소를 비세요.', '비가 쌓일수록 하늘이 어두워지고 야구장이 잠겨요.', '경기가 끝나면 패배 추모관. 다 같이 국화를 헌화해요.'], mine: [0,1,0,0,1,0,0,0,0], opp: [1,0,2,0,0,1,0,0,0] }, // 2:4
  draw: { label: '비긴 경기', title: '⛅ 3 : 3 · 애매한 날', lines: ['이기지도 지지도 않는 팽팽한 하늘. 비도 해도 마음대로 누르세요.', '같은 경기 팬끼리 비와 해가 줄다리기를 해요.', '경기가 끝나면 심야 대합실. 화면을 눌러 같이 한숨 쉬어요.'], mine: [0,2,0,0,0,1,0,0,0], opp: [0,0,0,3,0,0,0,0,0] }, // 3:3
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
// '경기 종료' 버튼은 룸 전체 종료(end_fan_room). 로컬 종료 상태는 쓰지 않음
const manualEnd = false;
try { if (roomParam) sessionStorage.removeItem(`fan-ended:${roomParam}`); } catch {}

function tellParent(data) { parent.postMessage({ source: 'fan-demo', ...data }, location.origin); }
function navigate(screen, room) {
  if (navigating || (typeof paused !== 'undefined' && paused)) return;
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
// ---- 구단 엠블럼 (출처: KBO 공식 사이트 엠블럼 이미지, public/logos) ----
const LOGO_CODES = ['LG', 'HH', 'SK', 'SS', 'NC', 'KT', 'LT', 'HT', 'OB', 'WO'];
const logoImg = (i, h) => `<img src="/logos/${LOGO_CODES[i]}.png" alt="${teams[i].name}" style="height:${h}px;width:auto;display:inline-block;vertical-align:middle">`;
const baseRenderTeamGrid = renderTeamGrid;
renderTeamGrid = function () { baseRenderTeamGrid(); document.querySelectorAll('#teamGrid .teamBtn .icon').forEach((el, i) => { el.innerHTML = logoImg(i, 30); }); };
const baseSyncTeams = syncTeams;
syncTeams = function () {
  baseSyncTeams();
  $('myIcon').innerHTML = logoImg(state.myTeam, 44); $('oppIcon').innerHTML = logoImg(state.oppTeam, 44);
  $('sbMyIcon').innerHTML = logoImg(state.myTeam, 26); $('sbOppIcon').innerHTML = logoImg(state.oppTeam, 26);
};
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
style.textContent = `.scenarioDesc{margin-top:16px;background:#1a2840;border:1px solid #33445d;border-radius:16px;padding:14px 16px;font-size:12px;line-height:1.7;color:#c9d6e8}
.scenarioDesc b{display:block;font-size:14px;color:#eef3fb;margin-bottom:6px}.scenarioDesc ul{margin:0;padding-left:16px}.scenarioDesc .rule{margin-top:10px;padding-top:10px;border-top:1px solid #2c3d58;font-size:11px;color:#8ea3c0}
.scenario{margin-bottom:4px;grid-template-columns:repeat(3,1fr)}.scenario .ghostBtn{padding:12px 6px;font-size:13px}.scenario .on{background:#f6d38b;color:#17202e;border-color:#f6d38b}.logo{cursor:pointer}.connectionNote{display:none;cursor:pointer}.minimalControls{bottom:128px}.endGame{pointer-events:auto;margin-top:12px;width:168px;border:0;border-radius:16px;padding:12px;background:#f2d08b;color:#172339;font-weight:900}`;
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
  const sc = SCENARIOS[key], box = $('scenarioDesc');
  if (box) box.innerHTML = `<b>${sc.title}</b><ul>${sc.lines.map((l) => `<li>${l}</li>`).join('')}</ul>
    <div class="rule">⏱ 20초마다 1이닝 · 5회(1분 40초) 기도 마감 · 9회(3분) 경기 종료<br>👥 같은 경기를 고른 사람끼리 비·해·헌화 수가 실시간으로 합쳐져요</div>`;
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
finishGame = function () {
  if (!connected) { toast('경기장에 연결하는 중이에요'); return; }
  if (sharedEnded) { navigate('result'); return; }
  if (navigating) return;
  toast('경기를 종료합니다'); tellParent({ type: 'end' });
};
randomOpponent = function () { toast('대진은 경기 목록에서 골라요'); };
// 추모관 '초기화' → 같은 경기 룸에서 새 경기 시작 (종료 후에만 DB가 허용)
resetDemo = function () {
  if (!sharedEnded) { toast('경기가 끝난 뒤 새 경기를 시작할 수 있어요'); return; }
  if (navigating) return; navigating = true; setTimeout(() => (navigating = false), 2000);
  sharedEnded = false;
  tellParent({ type: 'restart' });
};
document.querySelectorAll('#v4 .ghostBtn').forEach((b) => { if (b.textContent.trim() === '초기화') b.textContent = '새 경기'; });

// ---- BGM: 기도관 = 긴장, 끝난 뒤 결과·추모관 = 시나리오별(패배 오르간 / 승리 클럽 / 무승부 막차) ----
let paused = false;
function updateBgm() {
  if (!window.BGM) return;
  if (paused) { BGM.play(null); return; }
  const end = { lose: 'loss', win: 'win', draw: 'draw' }[scenario];
  BGM.play(state.step === 2 ? 'pray' : state.step >= 3 ? (sharedEnded ? end : 'pray') : null);
}
const bgmBtn = document.createElement('button');
bgmBtn.className = 'bgmToggle'; bgmBtn.setAttribute('aria-label', '배경음악 켜기/끄기');
bgmBtn.textContent = window.BGM?.muted ? '🔇' : '🔊';
bgmBtn.onclick = () => { bgmBtn.textContent = BGM.toggleMute() ? '🔇' : '🔊'; };
document.querySelector('.header')?.insertBefore(bgmBtn, $('headerTag'));
style.textContent += `.bgmToggle{margin-left:auto;margin-right:8px;background:none;border:0;font-size:15px;padding:4px;cursor:pointer}`;

// ---- 첫 진입 스플래시: 로고가 떴다가 서서히 사라지며 팀 선택 화면 등장 (세션당 1회) ----
(function splash() {
  let seen = false;
  try { seen = sessionStorage.getItem('sky-splash') === '1'; sessionStorage.setItem('sky-splash', '1'); } catch {}
  if (screenParam !== 'home' || seen) return;
  const el = document.createElement('div');
  el.className = 'splash';
  el.innerHTML = '<div class="splashMark">☁️</div><div class="splashName">하늘아<br><span>눈치 챙겨</span></div><div class="splashSub">야구 지는 날, 우리는 하늘에 빕니다</div>';
  (document.getElementById('phoneInner') || document.body).appendChild(el);
  setTimeout(() => el.classList.add('out'), 1500);
  setTimeout(() => el.remove(), 2300);
})();
style.textContent += `.splash{position:absolute;inset:0;z-index:100;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:radial-gradient(circle at 50% 38%,#24375a 0%,#111b2d 62%);color:#eef3fb;text-align:center;transition:opacity .8s ease,transform .8s ease}
.splash.out{opacity:0;transform:scale(1.04);pointer-events:none}
.splashMark{font-size:64px;animation:splashIn .9s cubic-bezier(.2,.8,.2,1) both}
.splashName{font-size:38px;font-weight:950;letter-spacing:-.05em;line-height:1.15;animation:splashIn .9s .15s cubic-bezier(.2,.8,.2,1) both}.splashName span{color:#ffce77}
.splashSub{font-size:12px;color:#9fb3cf;animation:splashIn .9s .35s cubic-bezier(.2,.8,.2,1) both}
@keyframes splashIn{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:none}}
.view.active{animation:viewIn .32s ease both}@keyframes viewIn{from{opacity:0}to{opacity:1}}`;

// ---- 초기 화면 ----
const initialStep = STEP_SCREEN.indexOf(screenParam);
if (inRoom && initialStep >= 3) { const sc = scoreAt(GAME_END_SEC); state.myScore = sc.my; state.oppScore = sc.opp; }
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
  setTimeout(() => { if (!connected) note('경기장에 연결하는 중…'); }, 1500);
  $('rainAction').disabled = true; $('sunAction').disabled = true; $('tributeBtn').disabled = true;
  if (initialStep === 3) $('resultButton').disabled = true;
}
$('connectionNote').addEventListener('click', () => { if (inRoom) { note('다시 연결하는 중…'); tellParent({ type: 'retry' }); } });

// ---- 호스트 → 데모: 공유 상태 반영 ----
window.addEventListener('message', (event) => {
  if (event.origin !== location.origin || event.source !== parent || event.data?.source !== 'fan-host') return;
  const m = event.data;
  if (m.type === 'pause') { paused = true; updateBgm(); return; }
  if (m.type === 'resume') { paused = false; updateBgm(); return; }
  if (m.type === 'error') { connected = false; note(`${m.message} (눌러서 다시 시도)`); return; }
  if (m.type !== 'state' || !m.room) return;
  applyRoom(m.room, m.restarted);
});
let lastRoomState = null;
setInterval(() => {
  if (!lastRoomState || paused) return;
  const e = (Date.now() - Date.parse(lastRoomState.started_at)) / 1000;
  const inning = Math.min(9, Math.floor(e / INNING_SEC) + 1);
  if (e >= PRAY_CLOSE_SEC !== sharedClosed || e >= GAME_END_SEC !== sharedEnded || (state.step === 2 && inning !== state.inning)) applyRoom(lastRoomState, false);
}, 1000);
let renderedSent = false;
function markRendered() { if (renderedSent) return; renderedSent = true; requestAnimationFrame(() => tellParent({ type: 'rendered' })); }
function applyRoom(r, restarted) {
  lastRoomState = r;
  connected = true; note('');
  const elapsed = Math.max(0, (Date.now() - Date.parse(r.started_at)) / 1000);
  sharedClosed = elapsed >= PRAY_CLOSE_SEC; sharedEnded = elapsed >= GAME_END_SEC || manualEnd;
  if (restarted) {
    sharedEnded = elapsed >= GAME_END_SEC;
    toast('이 경기장에서 새 경기가 시작됐어요');
    if (state.step >= 3) { navigate('pray'); return; }
  }

  state.tears = r.rain; state.suns = r.sun;
  state.inning = Math.min(9, Math.floor(elapsed / INNING_SEC) + 1); state.half = '말';
  { const sc = scoreAt(sharedEnded ? GAME_END_SEC : elapsed); state.myScore = sc.my; state.oppScore = sc.opp; }

  renderArena();
  $('rainAction').disabled = sharedClosed; $('sunAction').disabled = sharedClosed;
  document.querySelector('.chantToggle').disabled = sharedClosed;
  if (sharedClosed) $('chantComposer').classList.add('hidden');
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
  updateBgm();
  if (sharedEnded && state.step === 2) { navigate('result'); return; }
  markRendered();
}
updateBgm();
tellParent({ type: 'ready' });
if (!inRoom) markRendered();
