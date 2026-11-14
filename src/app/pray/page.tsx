import { redirect } from 'next/navigation';
import { RoomScreen } from '@/components/room-screen';
import { parseResult, parseRoom, parseTeam } from '@/lib/params';

type Q = Promise<{ room?: string; team?: string; result?: string }>;
export default async function Page({ searchParams }: { searchParams: Q }) {
  const q = await searchParams;
  const room = parseRoom(q.room);
  const team = parseTeam(q.team);
  // 룸 없이 직접 들어오면 팀 선택으로. (pray-hall.tsx의 대진 카드는 공통 경기 선택 화면으로 대체됨, 파일은 보존)
  if (!room) redirect(team !== undefined ? `/?team=${team}` : '/');
  return <RoomScreen screen="pray" roomId={room} team={team} result={parseResult(q.result)} />;
}
