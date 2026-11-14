import { supabase } from './supabase';

/** 공유 룸 한 줄. 경기 시계는 started_at 기준 (20초=1이닝, 100초 기도 마감, 180초 종료) */
export type Room = { id: string; started_at: string; rain: number; sun: number; flowers: number };
export type RoomAction = 'rain' | 'sun' | 'flowers';

export const ROOM_ID_RE = /^[a-zA-Z0-9_-]{1,40}$/;
export const isRoomId = (v: unknown): v is string => typeof v === 'string' && ROOM_ID_RE.test(v);

/** 입장. 룸이 없으면 만들고, 종료 후 60초 지난 룸이면 새 경기로 리셋 (supabase/002) */
export async function joinRoom(id: string): Promise<Room> {
  const { data, error } = await supabase.rpc('join_fan_room', { room_id: id });
  if (error || !data) throw new Error('경기장 연결을 준비 중이에요. 잠시 후 다시 시도해주세요.');
  return data as Room;
}

/** 읽기 전용 재조회. 주기적 동기화에는 이걸 사용 (입장 RPC는 리셋을 일으킬 수 있음) */
export async function getRoom(id: string): Promise<Room | null> {
  const { data, error } = await supabase.from('fan_rooms').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error('연결이 불안정해요. 자동으로 다시 시도하는 중이에요.');
  return (data as Room | null) ?? null;
}

/** 경기 종료(180초) 이후에만 새 경기로 리셋. 진행 중이면 현재 상태를 그대로 돌려줌 */
export async function restartRoom(id: string): Promise<Room> {
  const { data, error } = await supabase.rpc('restart_fan_room', { room_id: id });
  if (error || !data) throw new Error('새 경기를 시작하지 못했어요. 다시 눌러주세요.');
  return data as Room;
}

/** 비·해(100초 전만 반영), 헌화(180초 후만 반영). 시간 밖이면 DB가 조용히 무시 */
export async function actInRoom(id: string, action: RoomAction) {
  const { error } = await supabase.rpc('act_in_fan_room', { room_id: id, action_name: action });
  if (error) throw new Error('응원이 전송되지 않았어요. 다시 눌러주세요.');
}

/** 같은 룸의 변경을 실시간 수신. 반환값을 호출하면 구독 해제 */
export function subscribeRoom(id: string, receive: (room: Room) => void) {
  const channel = supabase
    .channel(`room:${id}:${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'fan_rooms', filter: `id=eq.${id}` }, (payload) =>
      receive(payload.new as Room),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
