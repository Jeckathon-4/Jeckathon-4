import { redirect } from 'next/navigation';
import { parseResult, parseRoom, parseTeam } from '@/lib/params';
import { EndingView } from './_components/EndingView';
import { parseScore } from './_components/scene';

type Q = Promise<{ room?: string; team?: string; result?: string; my?: string; opp?: string }>;
export default async function Page({ searchParams }: { searchParams: Q }) {
  const q = await searchParams;
  const room = parseRoom(q.room);
  const team = parseTeam(q.team);
  // 룸 없이 직접 들어오면 팀 선택으로
  if (!room) redirect(team !== undefined ? `/?team=${team}` : '/');
  return (
    <EndingView
      roomId={room}
      team={team ?? 6}
      result={parseResult(q.result)}
      my={parseScore(q.my)}
      opp={parseScore(q.opp)}
    />
  );
}
