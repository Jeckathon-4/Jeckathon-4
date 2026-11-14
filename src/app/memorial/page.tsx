import { redirect } from 'next/navigation';
import { RoomScreen } from '@/components/room-screen';
import { parseResult, parseRoom, parseTeam } from '@/lib/params';

type Q = Promise<{ room?: string; team?: string; result?: string }>;
export default async function Page({ searchParams }: { searchParams: Q }) {
  const q = await searchParams;
  const room = parseRoom(q.room);
  const team = parseTeam(q.team);
  // 룸 없이 직접 들어오면 팀 선택으로
  if (!room) redirect(team !== undefined ? `/?team=${team}` : '/');
  return <RoomScreen screen="memorial" roomId={room} team={team} result={parseResult(q.result)} />;
}
