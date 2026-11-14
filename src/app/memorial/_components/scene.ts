// 원본 프로토타입(v10) 4·5페이지 연출 계산. 화면 표시용이며 서버에 저장하지 않는다.
export type Mood = 'loss' | 'win';

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

/** 무승부 공간은 제외했으므로 이기지 못하면(동점 포함) 추모관 */
export function moodOf(myScore: number, oppScore: number): Mood {
  return myScore > oppScore ? 'win' : 'loss';
}

/** 공유된 헌화 수로 꽃 배치를 결정적으로 만든다 (모든 기기에서 같은 모양) */
export function tributeLayout(i: number) {
  return {
    x: 8 + ((i * 0.61803398875) % 1) * 77,
    y: Math.min(78, 10 + Math.floor(i / 9) * 11 + ((i * 7) % 15)),
    size: 0.68 + (i % 9) * 0.05,
    rotation: -53 + ((i * 29) % 107),
    seed: i * 7.31,
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

const DANCES = ['bounce', 'wave', 'spin', 'hop', 'sway'] as const;

/** 같은 번호는 항상 같은 춤. 기기마다 클럽이 똑같이 보인다. */
export function danceKind(i: number) {
  return DANCES[Math.floor(scatter(i, 5) * DANCES.length)];
}

export function dancerStyle(i: number) {
  return {
    '--clr': DANCER_COLORS[i % DANCER_COLORS.length],
    '--x': `${6 + scatter(i, 1) * 88}%`,
    '--y': `${4 + scatter(i, 2) * 68}%`,
    '--scale': (0.38 + scatter(i, 3) * 0.42).toFixed(2),
    '--tempo': `${0.32 + scatter(i, 4) * 0.4}s`,
  } as React.CSSProperties;
}

export const FIREWORK_COLORS = ['#ff4dcc', '#45dfff', '#ffe979', '#a0ffb0', '#ffffff'];

export const ENDING_COPY: Record<
  Mood,
  { chip: string; mood: string; button: string; label: string; unit: string; placeholder: string }
> = {
  loss: { chip: '패배 추모관', mood: '허무', button: '💐', label: '헌화하기', unit: '송이', placeholder: '꽃과 함께 한마디 (선택)' },
  win: { chip: '승리 클럽', mood: '환호', button: '🕺', label: '댄서 추가', unit: '명', placeholder: '오늘의 한마디 (선택)' },
};

export const RESULT_COPY: Record<Mood, { emoji: string; title: string; desc: string; button: string }> = {
  loss: { emoji: '🕯️', title: '결국 졌습니다.', desc: '비도 해도 경기 결과는 바꾸지 못했습니다.', button: '추모관' },
  win: { emoji: '🌞', title: '오늘은 해가 이겼습니다.', desc: '이제는 추모 대신 기념 장면을 채워봅니다.', button: '기념관' },
};
