'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { joinRoom, actInRoom, subscribeRoom } from '@/lib/room';
export function RoomScreen({roomId='sajik-01',screen='home',team='6'}:{roomId?:string;screen?:'home'|'pray'|'result'|'memorial';team?:string}){
 const frame=useRef<HTMLIFrameElement>(null);const router=useRouter();
 useEffect(()=>{
 let alive=true;
 const send=(data:object)=>{if(alive)frame.current?.contentWindow?.postMessage({source:'fan-host',...data},location.origin)};
 const refresh=()=>joinRoom(roomId).then(room=>send({type:'state',room})).catch(e=>send({type:'error',message:e.message}));
 const receive=async(e:MessageEvent)=>{
 if(e.origin!==location.origin||e.source!==frame.current?.contentWindow||e.data?.source!=='fan-demo')return;
 const m=e.data;
 if(m.type==='navigate'&&['pray','result','memorial'].includes(m.screen)&&/^[a-zA-Z0-9_-]{1,40}$/.test(m.room)){router.push(`/${m.screen}?room=${encodeURIComponent(m.room)}&team=${Number(m.team)||0}`)}
 if(m.type==='ready'&&screen!=='home')void refresh();
 if(m.type==='action'&&screen!=='home'&&['rain','sun','flowers'].includes(m.action)){try{await actInRoom(roomId,m.action);await refresh()}catch(e){send({type:'error',message:(e as Error).message})}}
 };
 window.addEventListener('message',receive);
 const unsubscribe=screen==='home'?()=>{}:subscribeRoom(roomId,room=>send({type:'state',room}));
 const timer=screen==='home'?undefined:setInterval(refresh,3000);
 return()=>{alive=false;window.removeEventListener('message',receive);unsubscribe();clearInterval(timer)};
 },[roomId,screen,router]);
 return <iframe ref={frame} title="비라도 와라 야구장" src={`/fan-demo.html?screen=${screen}&room=${encodeURIComponent(roomId)}&team=${encodeURIComponent(team)}`} style={{display:'block',width:'100%',height:'100dvh',border:0}}/>;
}
