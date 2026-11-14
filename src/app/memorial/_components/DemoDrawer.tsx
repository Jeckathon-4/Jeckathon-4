'use client';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { sceneQuery, type Scenario } from './scene';

/** 원본 v10의 ⚙ 시연 조작. 점수를 바꿔 패배 추모관/승리 클럽을 오갈 수 있다. 공유 데이터는 바꾸지 않는다. */
export function DemoDrawer({
  roomId,
  team,
  result,
  myScore,
  oppScore,
}: {
  roomId: string;
  team: number;
  result?: Scenario;
  myScore: number;
  oppScore: number;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const apply = (my: number, opp: number) =>
    router.replace(`${pathname}?${sceneQuery(roomId, team, result, Math.max(0, my), Math.max(0, opp))}`, { scroll: false });

  return (
    <>
      <button type="button" className="demoToggle" onClick={() => setOpen((v) => !v)} aria-label="시연 설정" title="시연 설정">
        ⚙
      </button>
      {open ? (
        <div className="demoDrawer">
          <div className="demoTitle">
            시연 조작 · {myScore} : {oppScore}
            <button type="button" onClick={() => setOpen(false)} aria-label="닫기">
              ×
            </button>
          </div>
          <div className="demoButtons">
            <button type="button" onClick={() => apply(myScore + 1, oppScore)}>
              내 팀 득점
            </button>
            <button type="button" onClick={() => apply(myScore, oppScore + 1)}>
              상대 득점
            </button>
            <button type="button" onClick={() => router.replace(`${pathname}?${sceneQuery(roomId, team, result)}`, { scroll: false })}>
              기본 점수
            </button>
          </div>
          <div className="demoButtons" style={{ marginTop: 8 }}>
            <button type="button" onClick={() => apply(myScore, myScore + 1)}>
              패배
            </button>
            <button type="button" onClick={() => apply(oppScore + 1, oppScore)}>
              승리
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
