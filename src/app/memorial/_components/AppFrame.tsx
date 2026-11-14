'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';
import '../memorial.css';

/** 원본 프로토타입의 앱 프레임(헤더·푸터·토스트). 결과(4)와 결과 공간(5) 화면이 함께 쓴다. */
export function AppFrame({
  tag,
  step,
  toast,
  note,
  children,
}: {
  tag: string;
  step: 4 | 5;
  toast: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <div className="memorialRoot">
      <header className="header">
        <Link className="logo" href="/">
          하늘아 <span>눈치 챙겨</span>
        </Link>
        <div className="badge">{tag}</div>
      </header>
      {note ? (
        <div className="connectionNote" role="status">
          {note}
        </div>
      ) : null}
      {children}
      <div className="footer">
        <span>하늘아 눈치 챙겨 · fan concept</span>
        <span>0{step} / 05</span>
      </div>
      <div className={`toast ${toast ? 'show' : ''}`} role="status">
        {toast}
      </div>
    </div>
  );
}
