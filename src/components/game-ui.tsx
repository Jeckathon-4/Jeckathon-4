import Link from 'next/link';
import type { ReactNode, ButtonHTMLAttributes } from 'react';
export function Button({children, className='', ...props}: ButtonHTMLAttributes<HTMLButtonElement>) {return <button className={`game-button ${className}`} {...props}>{children}</button>}
export function Shell({children}: {children: ReactNode}) {return <main className="app-shell"><header className="brand"><Link href="/">☁️ 비라도 와라<span>오늘도 야구에 진심인 우리</span></Link><span className="season">FAN CLUB · 2026</span></header>{children}<footer>승패는 잠깐, 팬심은 평생. ⚾</footer></main>}
export function Stadium(){return <div className="stadium" aria-label="초록 잔디와 관중석이 있는 야구장"><div className="cloud c1">☁</div><div className="cloud c2">☁</div><div className="sun">☀</div><div className="stands"><span>비 라 도 와 라</span></div><div className="grass"><div className="diamond"><span>⚾</span></div></div><div className="mascot">🧢<span>오늘은… 비가 오려나?</span></div></div>}
