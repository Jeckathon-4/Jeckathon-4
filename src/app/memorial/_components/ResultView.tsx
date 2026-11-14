'use client';
import Link from 'next/link';
import { AppFrame } from './AppFrame';
import { DemoDrawer } from './DemoDrawer';
import { useRoom } from './useRoom';
import { useToast } from './useToast';
import { GAME_END_SEC, RESULT_COPY, moodOf, sceneQuery, scoresFor, type Scenario } from './scene';

/** 4페이지: 경기 결과 카드 */
export function ResultView({
  roomId,
  team,
  result,
  my,
  opp,
}: {
  roomId: string;
  team: number;
  result?: Scenario;
  my?: number;
  opp?: number;
}) {
  const { room, error, elapsed } = useRoom(roomId);
  const { message } = useToast();
  const { myScore, oppScore } = scoresFor(result, my, opp);
  const ended = room !== null && elapsed >= GAME_END_SEC;
  const copy = RESULT_COPY[moodOf(myScore, oppScore)];
  const query = sceneQuery(roomId, team, result, my, opp);

  return (
    <AppFrame tag="RESULT" step={4} toast={message} note={error}>
      <section className="view">
        <div className="content">
          <Link className="back" href={`/pray?${query}`}>
            ← 경기장
          </Link>
          <div className="kicker">STEP 04</div>
          <div className="resultCard">
            <div className="bigEmoji">{copy.emoji}</div>
            <div className="resultTitle">{ended ? copy.title : '아직 끝나지 않았어요'}</div>
            <p className="resultText">{ended ? copy.desc : '9회 종료 후 결과가 확정됩니다.'}</p>
            <div className="stats">
              <div>
                💧<b>{(room?.rain ?? 0).toLocaleString()}</b>
              </div>
              <div>
                ☀️<b>{(room?.sun ?? 0).toLocaleString()}</b>
              </div>
            </div>
            <Link className="fullBtn" style={{ display: 'block' }} href={`/memorial?${query}`}>
              {copy.button}
            </Link>
          </div>
        </div>
        <DemoDrawer roomId={roomId} team={team} result={result} myScore={myScore} oppScore={oppScore} />
      </section>
    </AppFrame>
  );
}
