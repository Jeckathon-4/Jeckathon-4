import { supabase } from './supabase';
export type Room = {id:string; started_at:string; rain:number; sun:number; flowers:number};
export async function joinRoom(id:string):Promise<Room>{
 const {data,error}=await supabase.rpc('join_fan_room',{room_id:id});
 if(error) throw new Error('경기장 연결을 준비 중이에요. 잠시 후 다시 시도해주세요.');
 return data as Room;
}
export async function actInRoom(id:string,action:'rain'|'sun'|'flowers'){
 const {error}=await supabase.rpc('act_in_fan_room',{room_id:id,action_name:action});
 if(error) throw new Error('응원이 전송되지 않았어요. 다시 눌러주세요.');
}
export function subscribeRoom(id:string,receive:(room:Room)=>void){
 const channel=supabase.channel(`room:${id}`).on('postgres_changes',{event:'UPDATE',schema:'public',table:'fan_rooms',filter:`id=eq.${id}`},payload=>receive(payload.new as Room)).subscribe();
 return ()=>{void supabase.removeChannel(channel)};
}
