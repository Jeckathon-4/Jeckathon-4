'use client';
import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { actInRoom, restartRoom } from '@/lib/room';
import { AppFrame } from './AppFrame';
import { DemoDrawer } from './DemoDrawer';
import { Chrysanthemum } from './Chrysanthemum';
import { useRoom } from './useRoom';
import { useToast } from './useToast';
import {
  ENDING_COPY,
  FIREWORK_COLORS,
  GAME_END_SEC,
  TAP_DELAY,
  dancerStyle,
  matchSides,
  moodOf,
  sceneQuery,
  scoresFor,
  type Scenario,
  tributeLayout,
} from './scene';

type Note = { id: number; text: string; style: CSSProperties };
type Spot = { id: number; x: number; y: number; sparks?: number[] };

const MAX_FLOWERS = 300;
const MAX_FIGURES = 120;

/** 5페이지: 경기 결과별 공간 (패배 추모관 / 승리 클럽) */
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
  const { room, setRoom, error, elapsed } = useRoom(roomId);
  const toast = useToast();
  const { myScore, oppScore } = scoresFor(result, my, opp);
  const sides = matchSides(roomId, team);
  const mood = moodOf(myScore, oppScore);
  const copy = ENDING_COPY[mood];
  const ended = room !== null && elapsed >= GAME_END_SEC;
  const count = room?.flowers ?? 0;

  // 종료 전에 추모관으로 들어오면 결과 화면으로 (HANDOFF 플로우)
  const notEnded = room !== null && elapsed < GAME_END_SEC;
  useEffect(() => {
    if (notEnded) router.replace(`/result?${sceneQuery(roomId, team, result)}`);
  }, [notEnded, router, roomId, team, result]);

  const restart = async () => {
    try {
      await restartRoom(roomId);
      router.push(`/pray?${sceneQuery(roomId, team, result)}`);
    } catch (e) {
      toast.show((e as Error).message);
    }
  };

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
    setRoom((r) => (r ? { ...r, flowers: r.flowers + 1 } : r));
    try {
      await actInRoom(roomId, 'flowers');
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
      const x = Math.max(116, Math.min(rect.width - 116, px));
      const y = Math.max(205, Math.min(rect.height - 180, py));
      pushTemp(setSpots, { id, x, y }, 4300);
    } else {
      const x = Math.max(35, Math.min(rect.width - 35, px));
      const y = Math.max(75, Math.min(rect.height - 130, py));
      pushTemp(setSpots, { id, x, y, sparks: Array.from({ length: 20 }, () => 55 + Math.random() * 65) }, 1100);
    }
  };

  const screenClass = `endingScreen ${mood === 'win' ? 'isWin' : ''}`;

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
                      className="tribute"
                      style={{ left: `${f.x}%`, bottom: `${f.y}%`, rotate: `${f.rotation}deg`, scale: f.size, zIndex: i + 1 }}
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
                    <div key={i} className="clubDancer" style={dancerStyle(i)}>
                      <div className="danceBody">
                        <div className="head" />
                        <div className="torso" />
                        <div className="arm left" />
                        <div className="arm right" />
                        <div className="leg left" />
                        <div className="leg right" />
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

            <div className="memorialMessages">
              {notes.map((n) => (
                <div key={n.id} className="memoryNote" style={n.style}>
                  {n.text}
                </div>
              ))}
            </div>
            <div className="sceneTapHint">화면을 탭하면 함께 불을 붙입니다</div>
            <div className="cigaretteMoments" aria-hidden="true">
              {mood === 'loss' &&
                spots.map((s) => (
                  <div key={s.id} className="cigaretteMoment" style={{ left: s.x, top: s.y }}>
                    <svg viewBox="0 0 220 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <g transform="rotate(-33 110 115)">
                        <rect x="39" y="105" width="143" height="15" rx="5" fill="#e9eceb" />
                        <rect x="39" y="105" width="37" height="15" rx="3" fill="#c99461" />
                        <rect x="175" y="105" width="8" height="15" rx="2" fill="#ff8242" className="ember" />
                        <path
                          d="M178 103 Q165 80 181 64 Q192 46 176 24"
                          fill="none"
                          stroke="#d3d7da"
                          strokeWidth="4"
                          strokeLinecap="round"
                          className="smoke"
                        />
                      </g>
                    </svg>
                  </div>
                ))}
            </div>
          </div>

          <DemoDrawer roomId={roomId} team={team} result={result} myScore={myScore} oppScore={oppScore} />
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
              <button type="button" className="clearBtn" onClick={() => toast.show('함께 놓은 꽃은 지울 수 없어요')}>
                ↺
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
              <button type="button" onClick={() => void restart()}>
                새 경기
              </button>
              <button type="button" onClick={() => router.push(`/?team=${team}`)}>
                다른 경기
              </button>
            </div>
          </div>
        </div>
      </section>
    </AppFrame>
  );
}
