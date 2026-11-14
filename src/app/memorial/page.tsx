import { redirect } from 'next/navigation';
import { parseResult, parseRoom, parseTeam } from '@/lib/params';
import { Bgm } from '@/components/bgm';
import { EndingView } from './_components/EndingView';
import { parseScore } from './_components/scene';

type Q = Promise<{ room?: string; team?: string; result?: string; my?: string; opp?: string }>;
export default async function Page({ searchParams }: { searchParams: Q }) {
  const q = await searchParams;
  const room = parseRoom(q.room);
  const team = parseTeam(q.team);
  // 룸 없이 직접 들어오면 팀 선택으로
  if (!room) redirect(team !== undefined ? `/?team=${team}` : '/');
  const result = parseResult(q.result);
  // BGM: 이긴 경기 = 클럽, 진 경기 = 추모 오르간, 비긴 경기 = 심야 대합실
  const track = result === 'win' ? 'win' : result === 'draw' ? 'draw' : 'loss';
  return (
    <>
    <Bgm track={track} />
    <EndingView
      roomId={room}
      team={team ?? 6}
      result={result}
      my={parseScore(q.my)}
      opp={parseScore(q.opp)}
    />
    </>
  );
}
