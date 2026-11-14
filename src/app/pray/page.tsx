import { RoomScreen } from '@/components/room-screen';
import { PrayHall } from './pray-hall';

export default async function Page({ searchParams }: { searchParams: Promise<{ room?: string; team?: string; enter?: string }> }) {
  const { room, team, enter } = await searchParams;
  const roomId = room && /^[a-zA-Z0-9_-]{1,40}$/.test(room) ? room : 'sajik-01';
  const teamNumber = Number(team);
  const teamIndex = Number.isInteger(teamNumber) && teamNumber >= 0 && teamNumber < 10 ? teamNumber : 6;
  if (enter === '1') return <RoomScreen screen="pray" team={String(teamIndex)} roomId={roomId} />;
  return <PrayHall roomId={roomId} teamIndex={teamIndex} />;
}
