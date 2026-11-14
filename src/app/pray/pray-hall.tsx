'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const css = `
.pray{min-height:100dvh;max-width:480px;margin:0 auto;background:#111b2d;color:#eef3fb;display:flex;flex-direction:column;font-family:system-ui,-apple-system,'Apple SD Gothic Neo',sans-serif}
.pray-header{display:flex;justify-content:space-between;align-items:center;padding:18px 18px 10px}
.pray-logo{font-weight:900;font-size:14px}
.pray-logo span{color:#ffce77}
.pray-badge{font-size:10px;border:1px solid #3c4c66;color:#98adcc;border-radius:999px;padding:5px 8px}
.pray-content{padding:10px 18px 24px;flex:1}
.pray-back{color:#9caec7;font-size:12px}
.pray-kicker{font-size:11px;letter-spacing:.13em;color:#8eaed2;font-weight:900;margin:8px 0}
.pray h1{font-size:28px;font-weight:950;letter-spacing:-.05em;margin:0 0 10px;color:#eef3fb}
.pray p{font-size:13px;color:#a8b8ce;line-height:1.7;margin:0 0 16px}
.pray-fixture{background:#1a2840;border:1px solid #33445d;border-radius:20px;padding:18px}
.pray-top{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#a8b8ce}
.pray-pill{padding:5px 9px;border-radius:999px;background:#2f435f;color:#d2e0f2;font-weight:800}
.pray-versus{display:grid;grid-template-columns:1fr 44px 1fr;align-items:center;text-align:center;padding:18px 0 14px;font-size:13px;font-weight:900}
.pray-icon{display:block;font-size:26px;margin-bottom:7px}
.pray-vs{font-size:12px;color:#90a4bf}
.pray-foot{font-size:12px;color:#dce5f0;text-align:center}
.pray-meta{font-size:11px;color:#8398b5;text-align:center;line-height:1.7;margin-top:11px}
.pray-label{display:block;font-size:12px;font-weight:700;margin-top:16px}
.pray-room{width:100%;background:#152136;color:#eef3fb;border:1px solid #40526d;border-radius:12px;padding:12px;margin-top:8px}
.pray-full,.pray-sub{width:100%;border-radius:16px;padding:16px 14px;font-weight:900;margin-top:16px}
.pray-full{background:#ffd27b;color:#162033;border:0;box-shadow:0 4px 0 #a77b3b}
.pray-sub{background:#23324c;color:#eef4fb;border:1px solid #42546f}
.pray-note{min-height:18px;margin:10px 0 0;font-size:12px;color:#f5d9a0;text-align:center}
.pray-footer{border-top:1px solid #283752;padding:12px 18px 16px;display:flex;justify-content:space-between;font-size:10px;color:#8398b4}
`;

const teams = [
  { name: 'LG 트윈스', icon: '🔴' },
  { name: '한화 이글스', icon: '🦅' },
  { name: 'SSG 랜더스', icon: '🚀' },
  { name: '삼성 라이온즈', icon: '🦁' },
  { name: 'NC 다이노스', icon: '🦖' },
  { name: 'KT 위즈', icon: '🧙' },
  { name: '롯데 자이언츠', icon: '🌊' },
  { name: 'KIA 타이거즈', icon: '🐯' },
  { name: '두산 베어스', icon: '🐻' },
  { name: '키움 히어로즈', icon: '🦸' },
];

export function PrayHall({ roomId, teamIndex }: { roomId: string; teamIndex: number }) {
  const router = useRouter();
  const [opponent, setOpponent] = useState(teamIndex === 1 ? 6 : 1);
  const [room, setRoom] = useState(roomId);
  const [note, setNote] = useState('');
  const mine = teams[teamIndex] ?? teams[6];
  const other = teams[opponent] ?? teams[1];

  function changeOpponent() {
    const choices = teams.map((_, index) => index).filter((index) => index !== teamIndex);
    setOpponent(choices[Math.floor(Math.random() * choices.length)]);
    setNote('상대를 바꿨어요');
  }

  function enter() {
    const next = room.trim();
    if (!/^[a-zA-Z0-9_-]{1,40}$/.test(next)) {
      setNote('룸 이름은 영문, 숫자, -와 _로 입력해주세요');
      return;
    }
    router.push(`/pray?room=${encodeURIComponent(next)}&team=${teamIndex}&enter=1`);
  }

  return (
    <main className="pray">
      <style>{css}</style>
      <header className="pray-header">
        <div className="pray-logo">비라도 <span>와라</span></div>
        <div className="pray-badge">MATCH</div>
      </header>
      <section className="pray-content">
        <Link className="pray-back" href="/">← 뒤로</Link>
        <div className="pray-kicker">STEP 02</div>
        <h1 className="pray-title">오늘 경기</h1>
        <p className="pray-sub">{mine.name} 팬으로 들어갑니다.</p>
        <div className="pray-fixture">
          <div className="pray-top"><span>공동 기도관</span><span className="pray-pill">OPEN</span></div>
          <div className="pray-versus">
            <div><span className="pray-icon">{mine.icon}</span>{mine.name}</div>
            <div className="pray-vs">VS</div>
            <div><span className="pray-icon">{other.icon}</span>{other.name}</div>
          </div>
          <div className="pray-foot">18:30 · 사직 야구장</div>
          <div className="pray-meta">지는 팀은 비 · 이기는 팀은 해</div>
        </div>
        <label className="pray-label" htmlFor="room">친구와 같은 룸 이름으로 입장하세요</label>
        <input id="room" className="pray-room" value={room} maxLength={40} aria-label="룸 이름" onChange={(event) => setRoom(event.target.value)} />
        <p className="pray-note">{note}</p>
        <button className="pray-full" type="button" onClick={enter}>경기장 입장</button>
        <button className="pray-sub" type="button" onClick={changeOpponent}>상대 바꾸기</button>
      </section>
      <footer className="pray-footer"><span>비라도 와라 · fan concept</span><span>02 / 05</span></footer>
    </main>
  );
}
