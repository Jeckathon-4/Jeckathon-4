'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {Button, Shell, Stadium} from './game-ui';
import {joinRoom,actInRoom,subscribeRoom,type Room} from '@/lib/room';
export function RoomScreen({roomId,screen}:{roomId:string;screen:'pray'|'result'|'memorial'}){
 const [room,setRoom]=useState<Room|null>(null),[error,setError]=useState(''),[now,setNow]=useState(0),[pending,setPending]=useState(false);
 useEffect(()=>{let alive=true; const refresh=()=>joinRoom(roomId).then(r=>{if(alive){setRoom(r);setError('')}}).catch(e=>{if(alive)setError(e.message)});void refresh();const unsubscribe=subscribeRoom(roomId,r=>{if(alive)setRoom(r)});const timer=setInterval(()=>{setNow(Date.now());void refresh()},3000);return()=>{alive=false;unsubscribe();clearInterval(timer)}},[roomId]);
 const inning=room?Math.min(10,Math.floor((Math.max(now,Date.parse(room.started_at))-Date.parse(room.started_at))/20000)+1):1;
 const closed=inning>5,ended=inning>9;
 async function act(action:'rain'|'sun'|'flowers'){setPending(true);try{await actInRoom(roomId,action);setRoom(await joinRoom(roomId));setError('')}catch(e){setError((e as Error).message)}finally{setPending(false)}}
 const query=`?room=${encodeURIComponent(roomId)}`;
 return <Shell><div className="room-meta"><Link href="/">← 경기장 목록</Link><span>ROOM · {roomId}</span></div><div className="scoreboard"><span>🌊 롯데</span><strong>2 <small>:</small> 4</strong><span>한화 🦅</span><p>{ended?'경기 종료':`${inning}회 · 가상 경기`}</p></div>{error&&<p className="notice" role="status">{error}</p>}
 {screen==='pray'?<><div className="scene"><Stadium/><div className="scene-caption"><span className="pill">{closed?'기도 마감':'함께 만드는 오늘의 날씨'}</span><h1>{closed?'하늘도 최선을 다했어요.':'하늘아, 눈치 좀 챙겨.'}</h1><p>{closed?'경기 결과를 함께 기다려요.':'우리의 간절함이 모이면, 비가 올지도 몰라요.'}</p></div><div className="weather-actions"><Button disabled={!room||closed||pending} onClick={()=>act('rain')}>💧<b>비 와라</b><span>{room?.rain??0} 방울</span></Button><Button className="sun-button" disabled={!room||closed||pending} onClick={()=>act('sun')}>☀️<b>해 떠라</b><span>{room?.sun??0} 햇살</span></Button></div></div><Link className="text-link" href={'/result'+query}>경기 결과 보러 가기 →</Link></>:
 screen==='result'?<section className="result-card"><span className="hero-icon">{ended?'🥲':'🌤️'}</span><span className="eyebrow">{ended?'GAME OVER':'STILL PLAYING'}</span><h1>{ended?'오늘도, 야구가 밉다.':'아직 끝나지 않았어요.'}</h1><p>{ended?'비는 오지 않았지만, 우리는 함께였어요.':'5회가 지나면 기도가 마감되고, 9회가 끝나면 결과가 확정돼요.'}</p><div className="stats">💧 {room?.rain??0} 방울　 ☀️ {room?.sun??0} 햇살</div><Link className="game-button" href={'/memorial'+query}>추모관 둘러보기 🌼</Link><Link className="text-link" href={'/pray'+query}>경기장 돌아가기</Link></section>:
 <section className="memorial"><span className="eyebrow">OUR LITTLE MEMORIAL</span><h1>내일은 이기겠지.</h1><p>오늘의 아쉬움, 여기 두고 가요.</p><div className="flower-garden">{Array.from({length:Math.min(room?.flowers??0,36)},(_,i)=><span key={i} style={{left:`${8+(i*23)%80}%`,top:`${15+(i*17)%65}%`,transform:`rotate(${i%2?12:-12}deg)`}}>🌼</span>)}<div className="memorial-stone">⚾<br/>오늘의 승리<br/><small>잠시 쉬어갑니다</small></div></div><p>함께 놓은 꽃 {room?.flowers??0} 송이</p><Button disabled={!room||!ended||pending} onClick={()=>act('flowers')}>🌼 꽃 한 송이 놓기</Button>{!ended&&<p className="hint">헌화는 경기 종료 후 시작해요.</p>}<Link className="text-link" href={'/pray'+query}>같은 경기장으로 돌아가기</Link></section>}
 <nav className="bottom-nav"><Link href={'/pray'+query}>☔ 기도관</Link><Link href={'/result'+query}>⚾ 결과</Link><Link href={'/memorial'+query}>🌼 추모관</Link></nav></Shell>
}
