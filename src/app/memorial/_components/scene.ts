// 원본 프로토타입(v10) 4·5페이지 연출 계산. 화면 표시용이며 서버에 저장하지 않는다.
export type Mood = 'loss' | 'win' | 'draw';

/** 연타 간격 (ms) */
export const TAP_DELAY = 300;
/** 경기 시계 기준: 100초 기도 마감, 180초 경기 종료 (HANDOFF.md) */
export const PRAY_CLOSE_SEC = 100;
export const GAME_END_SEC = 180;

export type Scenario = 'win' | 'lose' | 'draw';
const SCENARIO_SCORES: Record<Scenario, [number, number]> = { win: [4, 2], lose: [2, 4], draw: [3, 3] };

/** 점수는 시나리오(URL result, 내 팀 기준) 기준: 이긴 4:2, 진 2:4, 비긴 3:3 (HANDOFF.md). 기본은 진 경기.
 *  URL의 my/opp(⚙ 시연 조작)가 있으면 그 점수를 쓴다. */
export function scoresFor(result?: Scenario, my?: number, opp?: number) {
  if (my !== undefined && opp !== undefined) return { myScore: my, oppScore: opp };
  const [myScore, oppScore] = SCENARIO_SCORES[result ?? 'lose'];
  return { myScore, oppScore };
}

/** 시연 조작 점수 파라미터 (0~30 정수만 허용) */
export function parseScore(v?: string) {
  if (v === undefined) return undefined;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n <= 30 ? n : undefined;
}

/** 화면 간 이동 시 유지할 쿼리 (room, team, result는 항상 유지) */
export function sceneQuery(roomId: string, team: number, result?: Scenario, my?: number, opp?: number) {
  const q = new URLSearchParams({ room: roomId, team: String(team) });
  if (result) q.set('result', result);
  if (my !== undefined && opp !== undefined) {
    q.set('my', String(my));
    q.set('opp', String(opp));
  }
  return q.toString();
}

export function moodOf(myScore: number, oppScore: number): Mood {
  if (myScore < oppScore) return 'loss';
  if (myScore > oppScore) return 'win';
  return 'draw';
}

/** 공유된 헌화 수로 꽃 배치를 결정적으로 만든다 (모든 기기에서 같은 모양) */
/** 차분하게 정렬된 헌화 배치: 5송이씩 줄을 맞춰 아래부터 쌓고(엇갈린 벽돌 배열), 7줄이 차면 조금 옮겨 다음 층 */
const COLS = 5;
const ROWS = 7;
export function tributeLayout(i: number) {
  const layer = Math.floor(i / (COLS * ROWS));
  const j = i % (COLS * ROWS);
  const row = Math.floor(j / COLS);
  const col = j % COLS;
  return {
    x: 6 + col * 15 + (row % 2) * 7.5 + (layer % 3) * 3,
    y: 30 + row * 6.5 + (layer % 3) * 2,
    size: 1,
    rotation: -12,
    seed: i * 7.31,
    // 아래 줄이 앞에 보이도록
    z: layer * 100 + (ROWS - row) * 10 + col,
  };
}

export const TEAM_NAMES = ['LG', '한화', 'SSG', '삼성', 'NC', 'KT', '롯데', 'KIA', '두산', '키움'];
const MATCHES = [
  { id: 'm1', a: 6, b: 1 },
  { id: 'm2', a: 0, b: 8 },
  { id: 'm3', a: 7, b: 3 },
  { id: 'm4', a: 2, b: 9 },
  { id: 'm5', a: 4, b: 5 },
];

/** 점수 왼쪽이 내 팀, 오른쪽이 상대. 룸의 고정 대진과 맞춘다. */
export function matchSides(roomId: string, team: number) {
  const match = MATCHES.find((m) => m.id === roomId);
  const mine = match && team !== match.a && team !== match.b ? match.a : team;
  const opp = match ? (mine === match.a ? match.b : match.a) : mine === 1 ? 6 : 1;
  return { mine: TEAM_NAMES[mine] ?? '내 팀', opp: TEAM_NAMES[opp] ?? '상대' };
}

const DANCER_COLORS = ['#f884e4', '#77e8ff', '#e4ff78', '#ffbb71', '#d0a3ff', '#ffffff'];

/** 0~1. 같은 i면 항상 같은 자리라 여러 기기에서 클럽이 똑같이 보인다. */
function scatter(i: number, salt: number) {
  const n = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

export function dancerStyle(i: number) {
  return {
    '--clr': DANCER_COLORS[i % DANCER_COLORS.length],
    '--x': `${6 + scatter(i, 1) * 88}%`,
    '--y': `${4 + scatter(i, 2) * 68}%`,
    '--scale': (0.55 + scatter(i, 3) * 0.7).toFixed(2),
    '--tempo': `${0.32 + scatter(i, 4) * 0.4}s`,
  } as React.CSSProperties;
}

const SHIRTS = ['#9aa6b8', '#899b83', '#ba9d8b', '#8397ad', '#a589a8', '#c4a368', '#8497a0'];
const SKINS = ['#f1c9a7', '#cf9e7b', '#e7b58c', '#c99172'];
const HAIRS = ['#282b31', '#4c3831', '#333842'];
/** 무승부 대합실: 누를수록 지친 팬이 뒤에서부터 한 명씩 남는다 (8명마다 새 줄) */
export function waitingPersonStyle(i: number) {
  const x = 12 + ((i * 0.61803398875) % 1) * 76;
  const row = Math.floor(i / 8);
  const bottom = 33 - Math.min(row, 5) * 5 + (i % 3) * 2;
  return {
    '--left': `${x.toFixed(2)}%`,
    '--bottom': `${Math.max(7, bottom)}%`,
    '--scale': (0.72 + Math.min(row, 6) * 0.13 + (i % 4) * 0.035).toFixed(2),
    '--z': String(10 + row),
    '--skin': SKINS[i % SKINS.length],
    '--hair': HAIRS[i % 3],
    '--shirt': SHIRTS[i % SHIRTS.length],
    '--lean': `${[-8, 6, 12, -12][i % 4]}deg`,
    '--beat': `${(i % 5) * 0.3}s`,
  } as React.CSSProperties;
}

export const SIGH_WORDS = ['하...', '에휴', '집에 가자...', '아...', '그냥 집 가자', '내 시간...'];
export const FIREWORK_COLORS = ['#ff4dcc', '#45dfff', '#ffe979', '#a0ffb0', '#ffffff'];

export const ENDING_COPY: Record<
  Mood,
  { chip: string; mood: string; button: string; label: string; unit: string; placeholder: string }
> = {
  loss: { chip: '패배 추모관', mood: '허무', button: '💐', label: '헌화하기', unit: '송이', placeholder: '꽃과 함께 한마디 (선택)' },
  win: { chip: '승리 클럽', mood: '환호', button: '🕺', label: '댄서 추가', unit: '명', placeholder: '오늘의 한마디 (선택)' },
  draw: { chip: '무승부 · 심야 대합실', mood: '한숨', button: '🚶', label: '집에 가기', unit: '명', placeholder: '한숨 한마디 (선택)' },
};

export const RESULT_COPY: Record<Mood, { emoji: string; title: string; desc: string; button: string }> = {
  loss: { emoji: '🕯️', title: '결국 졌습니다.', desc: '비도 해도 경기 결과는 바꾸지 못했습니다.', button: '추모관' },
  win: { emoji: '🌞', title: '오늘은 해가 이겼습니다.', desc: '이제는 추모 대신 기념 장면을 채워봅니다.', button: '기념관' },
  draw: { emoji: '🌥️', title: '비겼습니다.', desc: '묘하게 찝찝한 하루.', button: '기록관' },
};
