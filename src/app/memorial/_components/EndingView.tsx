'use client';
import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ENDING_FIELD, actInRoom } from '@/lib/room';
import { AppFrame } from './AppFrame';
import { Chrysanthemum } from './Chrysanthemum';
import { useRoom } from './useRoom';
import { useToast } from './useToast';
import {
  ENDING_COPY,
  FIREWORK_COLORS,
  SIGH_WORDS,
  GAME_END_SEC,
  TAP_DELAY,
  danceKind,
  dancerStyle,
  matchSides,
  moodOf,
  sceneQuery,
  scoresFor,
  type Scenario,
  tributeLayout,
  waitingPersonStyle,
} from './scene';

type Note = { id: number; text: string; style: CSSProperties };
type Spot = { id: number; x: number; y: number; text?: string; sparks?: number[]; kind?: 'cig' | 'bottle'; rot?: number };

const MAX_FLOWERS = 300;
const MAX_FIGURES = 120;

/** 5페이지: 경기 결과별 공간 (패배 추모관 / 승리 클럽 / 무승부 심야 대합실) */
export function EndingView({
  roomId,
  team,
  result,
  my,
  opp,
}: {
  roomId: string;
  team: number;
  result?: Scenario;
  my?: number;
  opp?: number;
}) {
  const router = useRouter();
  const { room, setRoom, error, elapsed, initialFlowers } = useRoom(roomId);
  const toast = useToast();
  const { myScore, oppScore } = scoresFor(result, my, opp);
  const sides = matchSides(roomId, team);
  const mood = moodOf(myScore, oppScore);
  const copy = ENDING_COPY[mood];
  const ended = room !== null && elapsed >= GAME_END_SEC;
  // 끝화면별로 따로 세기 (이긴 팀 댄서가 진 팀 헌화에 섞이지 않게)
  const field = ENDING_FIELD[mood];
  const count = room?.[field] ?? 0;

  // 종료 전에 추모관으로 들어오면 결과 화면으로 (HANDOFF 플로우)
  const notEnded = room !== null && elapsed < GAME_END_SEC;
  useEffect(() => {
    if (notEnded) router.replace(`/result?${sceneQuery(roomId, team, result)}`);
  }, [notEnded, router, roomId, team, result]);

  const [message, setMessage] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const nextId = useRef(0);
  const lastTribute = useRef(0);
  const lastTap = useRef(0);

  const pushTemp = <T extends { id: number }>(set: (fn: (prev: T[]) => T[]) => void, item: T, life: number) => {
    set((prev) => [...prev, item]);
    setTimeout(() => set((prev) => prev.filter((p) => p.id !== item.id)), life);
  };

  const addTribute = async (text: string) => {
    const t = Date.now();
    if (t - lastTribute.current < TAP_DELAY) return;
    lastTribute.current = t;
    if (!ended) {
      toast.show('경기 종료 후 함께 헌화해요');
      return;
    }
    const id = nextId.current++;
    const msg = text.trim().slice(0, 48);
    if (msg) {
      pushTemp(setNotes, {
        id,
        text: msg,
        style: {
          '--x': `${6 + Math.random() * 78}%`,
          '--y': `${8 + Math.random() * 70}%`,
          '--a': `${-18 + Math.random() * 36}deg`,
          zIndex: 20 + (id % 40),
        } as CSSProperties,
      }, 3350);
    }
    setRoom((r) => (r ? { ...r, [field]: (r[field] ?? 0) + 1 } : r));
    try {
      await actInRoom(roomId, field);
    } catch (e) {
      toast.show((e as Error).message);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void addTribute(message);
    setMessage('');
  };

  const onSceneTap = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button,form,input,.endingBottom,.endingTop,.demoDrawer')) return;
    const t = Date.now();
    if (t - lastTap.current < TAP_DELAY) return;
    lastTap.current = t;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const id = nextId.current++;
    if (mood === 'loss') {
      // 담배 또는 술잔을 랜덤으로. 담배는 360도 아무 방향으로나 놓인다
      const x = Math.max(90, Math.min(rect.width - 90, px));
      const y = Math.max(150, Math.min(rect.height - 180, py));
      const kind = Math.random() < 0.5 ? 'cig' : 'bottle';
      const rot = kind === 'cig' ? Math.random() * 360 : -15 + Math.random() * 30;
      pushTemp(setSpots, { id, x, y, kind, rot }, 4300);
    } else if (mood === 'win') {
      const x = Math.max(35, Math.min(rect.width - 35, px));
      const y = Math.max(75, Math.min(rect.height - 130, py));
      pushTemp(setSpots, { id, x, y, sparks: Array.from({ length: 20 }, () => 55 + Math.random() * 65) }, 1100);
    } else {
      const x = Math.max(50, Math.min(rect.width - 50, px));
      const y = Math.max(135, Math.min(rect.height - 165, py));
      pushTemp(setSpots, { id, x, y, text: SIGH_WORDS[Math.floor(Math.random() * SIGH_WORDS.length)] }, 2200);
    }
  };

  const screenClass = `endingScreen ${mood === 'win' ? 'isWin' : ''} ${mood === 'draw' ? 'isDraw' : ''}`;

  return (
    <AppFrame tag="MEMORIAL" step={5} toast={toast.message} note={error}>
      <section className="view">
        <div className={screenClass} onClick={onSceneTap}>
          <div className="endingTop">
            <div className="endingChip">{copy.chip}</div>
            <div className="endingScore">
              <span className="who">
                {sides.mine} vs {sides.opp}
              </span>
              <span className="num">
                {myScore} : {oppScore}
              </span>
            </div>
          </div>

          <div className="endingScene">
            <div className="sceneBase" />
            <div className="sceneLabel">
              <div className="emoji">🕯️</div>
              <div className="line1">오늘의 승리</div>
            </div>
            <div className="flowerField">
              {mood === 'loss' &&
                Array.from({ length: Math.min(count, MAX_FLOWERS) }, (_, i) => {
                  const f = tributeLayout(i);
                  return (
                    <div
                      key={i}
                      className={`tribute ${initialFlowers !== null && i >= initialFlowers ? 'fresh' : ''}`}
                      style={{
                        left: `${f.x}%`,
                        bottom: `${f.y}%`,
                        rotate: `${f.rotation}deg`,
                        scale: `${f.flip ? -f.size : f.size} ${f.size}`,
                        zIndex: f.z,
                      }}
                    >
                      <Chrysanthemum seed={f.seed} />
                    </div>
                  );
                })}
            </div>

            <div className="victoryScene" aria-hidden="true">
              <div className="clubGlow" />
              <div className="clubMirror" />
              <div className="clubLaser a" />
              <div className="clubLaser b" />
              <div className="clubLaser c" />
              <div className="clubFloor" />
              <div className="clubHeadline">WE WON!</div>
              <div className="clubDancers">
                {mood === 'win' &&
                  Array.from({ length: Math.min(count, MAX_FIGURES) }, (_, i) => (
                    <div key={i} className={`clubDancer ${danceKind(i)}`} style={dancerStyle(i)}>
                      <div className="danceBody">
                        <div className="torso">
                          <div className="head" />
                          <div className="joint arm left">
                            <div className="limb" />
                          </div>
                          <div className="joint arm right">
                            <div className="limb" />
                          </div>
                          <div className="joint leg left">
                            <div className="limb" />
                          </div>
                          <div className="joint leg right">
                            <div className="limb" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              <div className="clubTapHint">TAP ✦ FIREWORKS</div>
              <div className="clubFireworks">
                {mood === 'win' &&
                  spots.map((s) => (
                    <div key={s.id} className="clubFirework" style={{ '--x': `${s.x}px`, '--y': `${s.y}px` } as CSSProperties}>
                      {s.sparks?.map((r, i) => (
                        <span
                          key={i}
                          className="clubSpark"
                          style={{ '--a': `${i * 18}deg`, '--r': `${r}px`, '--c': FIREWORK_COLORS[i % FIREWORK_COLORS.length] } as CSSProperties}
                        />
                      ))}
                    </div>
                  ))}
              </div>
            </div>

            <div className="waitingScene" aria-hidden="true">
              <div className="waitingGlass" />
              <div className="waitingLamp" />
              <div className="waitingSign">
                집에나 갑시다.<small>LAST TRAIN · SERVICE ENDED</small>
              </div>
              <div className="waitingPlatform" />
              <div className="waitingBench">
                <div className="benchBack" />
                <div className="seat" />
                <div className="legs" />
              </div>
              <div className="waitingPeople">
                {mood === 'draw' &&
                  Array.from({ length: Math.min(count, MAX_FIGURES) }, (_, i) => (
                    <div key={i} className="waitingPerson" style={waitingPersonStyle(i)}>
                      <div className="personPose">
                        <div className="hair" />
                        <div className="head" />
                        <div className="face" />
                        <div className="body" />
                        <div className="arm l" />
                        <div className="arm r" />
                        <div className="leg l" />
                        <div className="leg r" />
                        <div className="shoe l" />
                        <div className="shoe r" />
                        {i % 7 === 4 ? <div className="sleep">zZ</div> : null}
                      </div>
                    </div>
                  ))}
              </div>
              <div className="waitingHint">TAP · 하...</div>
              <div className="waitingSighs">
                {mood === 'draw' &&
                  spots.map((s) => (
                    <div key={s.id} className="waitingSigh" style={{ '--x': `${s.x}px`, '--y': `${s.y}px` } as CSSProperties}>
                      {s.text}
                    </div>
                  ))}
              </div>
            </div>

            <div className="memorialMessages">
              {notes.map((n) => (
                <div key={n.id} className="memoryNote" style={n.style}>
                  {n.text}
                </div>
              ))}
            </div>
            <div className="sceneTapHint">화면을 탭하면 함께 한 대, 한 잔</div>
            <div className="cigaretteMoments" aria-hidden="true">
              {mood === 'loss' &&
                spots.map((s) => (
                  <div key={s.id} className="cigaretteMoment" style={{ left: s.x, top: s.y }}>
                    {s.kind === 'bottle' ? <SojuBottle rot={s.rot ?? 0} /> : <Cigarette rot={s.rot ?? 0} />}
                  </div>
                ))}
            </div>
          </div>

          <div className="endingBottom">
            <div className="endingMini">
              <div className="box">
                <div className="value">
                  {count.toLocaleString()}
                  {copy.unit}
                </div>
              </div>
            </div>
            <div className="miniBtns">
              <button type="button" className="tributeBtn" aria-label={copy.label} onClick={() => void addTribute('')}>
                {copy.button}
              </button>
            </div>
            <form className="tributeComposer" onSubmit={onSubmit}>
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={48}
                placeholder={copy.placeholder}
                autoComplete="off"
                aria-label="헌화 메시지"
              />
              <button type="submit">남기기</button>
            </form>
            <div className="endingNav">
              <button type="button" onClick={() => router.push('/')}>
                처음으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </section>
    </AppFrame>
  );
}

/** 담배: 몸통은 rot만큼 회전, 연기는 불씨 위치에서 항상 위로 피어오른다 */
function Cigarette({ rot }: { rot: number }) {
  const rad = (rot * Math.PI) / 180;
  const ex = 110 + 69 * Math.cos(rad);
  const ey = 90 + 69 * Math.sin(rad);
  return (
    <svg viewBox="0 0 220 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g transform={`rotate(${rot} 110 90)`}>
        <rect x="39" y="83" width="143" height="15" rx="5" fill="#e9eceb" />
        <rect x="39" y="83" width="37" height="15" rx="3" fill="#c99461" />
        <rect x="175" y="83" width="8" height="15" rx="2" fill="#ff8242" className="ember" />
      </g>
      <path
        d={`M${ex} ${ey - 4} q-13 -23 3 -39 q11 -18 -5 -40`}
        fill="none"
        stroke="#d3d7da"
        strokeWidth="4"
        strokeLinecap="round"
        className="smoke"
      />
    </svg>
  );
}

/** 소주병: 초록 병에 빨간 뚜껑 (상표 로고는 넣지 않은 일반 소주병) */
function SojuBottle({ rot }: { rot: number }) {
  return (
    <svg viewBox="0 0 220 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g transform={`rotate(${rot} 110 100)`}>
        <ellipse cx="110" cy="171" rx="30" ry="5" fill="#000" opacity=".35" />
        <path
          d="M102 40 L118 40 L118 64 Q135 74 136 92 L136 160 Q136 170 126 170 L94 170 Q84 170 84 160 L84 92 Q85 74 102 64 Z"
          fill="#2f9a4f"
          opacity=".92"
        />
        <path d="M90 96 Q91 82 104 72" stroke="#bff0c8" strokeWidth="4" fill="none" strokeLinecap="round" opacity=".6" />
        <rect x="86" y="108" width="48" height="36" rx="3" fill="#f4f6f1" />
        <rect x="86" y="108" width="48" height="5" fill="#2f9a4f" opacity=".5" />
        <text x="110" y="134" textAnchor="middle" fontSize="13" fontWeight="900" fill="#1f6a35">
          소주
        </text>
        <rect x="99" y="18" width="22" height="24" rx="3" fill="#d8262c" />
        <path d="M103 20 V40 M108 20 V40 M113 20 V40 M118 20 V40" stroke="#a51a1f" strokeWidth="1.6" />
        <rect x="97" y="38" width="26" height="5" rx="2" fill="#b81f24" />
        <path d="M89 100 V158" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity=".28" />
      </g>
    </svg>
  );
}
