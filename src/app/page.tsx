import { RoomScreen } from '@/components/room-screen';
import { parseResult, parseTeam } from '@/lib/params';

type Q = Promise<{ screen?: string; team?: string; result?: string }>;
export default async function Home({ searchParams }: { searchParams: Q }) {
  const q = await searchParams;
  const team = parseTeam(q.team);
  // 팀 선택 → (screen=match) 내 팀 경기 카드 + 시나리오 선택 → 기도관
  const screen = q.screen === 'match' && team !== undefined ? 'match' : 'home';
  return <RoomScreen screen={screen} team={team} result={parseResult(q.result)} />;
}
