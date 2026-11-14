'use client';
import { useEffect, useState } from 'react';
import { getRoom, joinRoom, subscribeRoom, type Room } from '@/lib/room';

/**
 * 결과·추모관은 읽기 전용: getRoom으로만 재조회한다 (joinRoom은 오래 끝난 룸을 새 경기로 리셋할 수 있음).
 * 룸이 아예 없을 때만 joinRoom으로 생성. Realtime 구독 + 3초 재조회, 경기 시계용 현재 시각은 1초마다 갱신.
 */
export function useRoom(roomId: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState('');
  /** 처음 불러왔을 때의 헌화 수. 이보다 뒤에 놓인 꽃만 떨어지는 애니메이션 */
  const [initialFlowers, setInitialFlowers] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const r = (await getRoom(roomId)) ?? (await joinRoom(roomId));
        if (!alive) return;
        setRoom(r);
        setInitialFlowers((v) => v ?? r.flowers);
        setError('');
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    };
    void refresh();
    const unsubscribe = subscribeRoom(roomId, (r) => alive && setRoom(r));
    const poll = setInterval(refresh, 3000);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      alive = false;
      unsubscribe();
      clearInterval(poll);
      clearInterval(clock);
    };
  }, [roomId]);

  const elapsed = room ? Math.max(0, (now - Date.parse(room.started_at)) / 1000) : 0;
  return { room, setRoom, error, elapsed, initialFlowers };
}
