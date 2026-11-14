'use client';
// React 화면(추모관 등)용 BGM. public/bgm.js 엔진을 이 문서에 한 번 로드해 재생한다.
// 사용: <Bgm track="loss" />  (pray | loss | win | draw). 화면을 벗어나면 자동 정지.
import { useEffect } from 'react';

type Track = 'pray' | 'loss' | 'win' | 'draw' | null;
type BgmApi = { play: (t: Track) => void };

function loadEngine(): Promise<BgmApi | undefined> {
  const w = window as unknown as { BGM?: BgmApi; __bgmLoading?: Promise<void> };
  if (w.BGM) return Promise.resolve(w.BGM);
  w.__bgmLoading ??= new Promise<void>((resolve) => {
    const s = document.createElement('script');
    s.src = '/bgm.js';
    s.onload = () => resolve();
    s.onerror = () => resolve();
    document.head.appendChild(s);
  });
  return w.__bgmLoading.then(() => w.BGM);
}

export function Bgm({ track }: { track: Track }) {
  useEffect(() => {
    let alive = true;
    void loadEngine().then((b) => alive && b?.play(track));
    return () => {
      alive = false;
      (window as unknown as { BGM?: BgmApi }).BGM?.play(null);
    };
  }, [track]);
  return null;
}
