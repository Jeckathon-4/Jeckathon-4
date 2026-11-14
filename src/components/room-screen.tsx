'use client';
// 원본 HTML(public/fan-demo.html)을 iframe으로 띄우고, Next 라우팅·Supabase와 메시지로 연결한다.
// 메시지 규약은 docs/HANDOFF.md 참고.
import { useEffect, useRef, useState } from 'react';
import { APP_BG, PHONE_BG } from './app-loading';
import { useRouter } from 'next/navigation';
import { actInRoom, endRoom, getRoom, isRoomId, joinRoom, restartRoom, subscribeRoom, type Room } from '@/lib/room';

export type Screen = 'home' | 'match' | 'pray' | 'result' | 'memorial';
const ROOM_SCREENS: Screen[] = ['pray', 'result', 'memorial'];
const ALL_SCREENS: Screen[] = ['home', 'match', ...ROOM_SCREENS];

export type Scenario = 'win' | 'lose' | 'draw';
export function screenHref(screen: Screen, room: string | undefined, team: number, result?: Scenario) {
  const r = result ? `&result=${result}` : '';
  if (screen === 'home') return `/?team=${team}`;
  if (screen === 'match') return `/?screen=match&team=${team}${r}`;
  return `/${screen}?room=${encodeURIComponent(room ?? '')}&team=${team}${r}`;
}
const isScenario = (v: unknown): v is Scenario => v === 'win' || v === 'lose' || v === 'draw';

export function RoomScreen({ roomId, screen = 'home', team, result }: { roomId?: string; screen?: Screen; team?: number; result?: Scenario }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [shown, setShown] = useState(false);
  // iframe이 하이드레이션 전에 이미 로드됐거나 onLoad를 놓쳐도 반드시 보이게
  useEffect(() => {
    if (frame.current?.contentDocument?.readyState === 'complete') setShown(true);
    const t = setTimeout(() => setShown(true), 900);
    return () => clearTimeout(t);
  }, []);
  const router = useRouter();
  const inRoom = ROOM_SCREENS.includes(screen) && !!roomId;

  useEffect(() => {
    let alive = true;
    const win = frame.current?.contentWindow;
    let lastStart = '';
    let lastRoom: Room | null = null;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const send = (data: object) => {
      if (alive) frame.current?.contentWindow?.postMessage({ source: 'fan-host', ...data }, location.origin);
    };
    const push = (room: Room) => {
      const restarted = !!lastStart && lastStart !== room.started_at;
      lastStart = room.started_at;
      lastRoom = room;
      send({ type: 'state', room, restarted });
    };
    const fail = (e: unknown) => send({ type: 'error', message: (e as Error).message });
    const refresh = async () => {
      if (!roomId) return;
      try {
        const room = (await getRoom(roomId)) ?? (await joinRoom(roomId));
        push(room);
      } catch (e) {
        fail(e);
      }
    };
    const enter = async () => {
      if (!roomId) return;
      try {
        // 기도관 진입 때만 입장 RPC (종료 후 60초 지난 룸이면 새 경기). 결과·추모관은 읽기만.
        push(screen === 'pray' ? await joinRoom(roomId) : ((await getRoom(roomId)) ?? (await joinRoom(roomId))));
      } catch (e) {
        fail(e);
      }
    };
    const softRefresh = () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(refresh, 400);
    };

    const receive = async (e: MessageEvent) => {
      if (e.origin !== location.origin || e.source !== frame.current?.contentWindow || e.data?.source !== 'fan-demo') return;
      const m = e.data;
      const t = Number.isInteger(Number(m.team)) ? Number(m.team) : (team ?? 6);
      const res = isScenario(m.result) ? m.result : result;
      if (m.type === 'navigate' && ALL_SCREENS.includes(m.screen)) {
        const room = isRoomId(m.room) ? m.room : roomId;
        if (ROOM_SCREENS.includes(m.screen) && !room) return;
        router.push(screenHref(m.screen, room, t, res));
      }
      // iframe이 늦게 준비돼도 마지막 상태를 다시 보내 연결 누락 방지
      if (m.type === 'ready' && inRoom) {
        if (lastRoom) send({ type: 'state', room: lastRoom, restarted: false });
        else void enter();
      }
      if (m.type === 'retry' && inRoom) void enter();
      if (m.type === 'action' && inRoom && ['rain', 'sun', 'flowers'].includes(m.action)) {
        try {
          await actInRoom(roomId!, m.action);
          softRefresh();
        } catch (err) {
          fail(err);
        }
      }
      if (m.type === 'end' && inRoom) {
        try {
          push(await endRoom(roomId!));
        } catch (err) {
          fail(err);
        }
      }
      if (m.type === 'restart' && inRoom) {
        try {
          const room = await restartRoom(roomId!);
          push(room);
          router.push(screenHref('pray', roomId, t, res));
        } catch (err) {
          fail(err);
        }
      }
    };
    window.addEventListener('message', receive);
    const unsubscribe = inRoom ? subscribeRoom(roomId!, push) : () => {};
    const timer = inRoom ? setInterval(refresh, 3000) : undefined;
    if (inRoom) void enter();
    send({ type: 'resume' });
    return () => {
      win?.postMessage({ source: 'fan-host', type: 'pause' }, location.origin);
      alive = false;
      window.removeEventListener('message', receive);
      unsubscribe();
      clearInterval(timer);
      clearTimeout(refreshTimer);
    };
  }, [roomId, screen, team, result, inRoom, router]);

  const qs = new URLSearchParams({ screen, ...(roomId ? { room: roomId } : {}), ...(team !== undefined ? { team: String(team) } : {}), ...(result ? { result } : {}) });
  return (
    // 전환 깜빡임 방지: 앱 배경을 먼저 깔고, iframe은 로드 후 부드럽게 나타남
    <div style={{ minHeight: '100dvh', background: APP_BG }}>
      <div style={{ position: 'fixed', inset: 0, maxWidth: 480, margin: '0 auto', background: PHONE_BG }} />
      <iframe
        ref={frame}
        title="하늘아 눈치 챙겨 야구장"
        allow="autoplay; clipboard-write"
        src={`/fan-demo.html?${qs}`}
        onLoad={() => setShown(true)}
        style={{ position: 'relative', display: 'block', width: '100%', height: '100dvh', border: 0, background: 'transparent', opacity: shown ? 1 : 0, transition: 'opacity .28s ease' }}
      />
    </div>
  );
}
