import {RoomScreen} from '@/components/room-screen';
export default async function Page({searchParams}:{searchParams:Promise<{room?:string}>}){const {room}=await searchParams;return <RoomScreen screen="memorial" roomId={room&&/^[a-zA-Z0-9_-]{1,40}$/.test(room)?room:'sajik-01'}/>}
