import { isRoomId } from './room';

/** URL 쿼리 → 안전한 roomId / team(0~9). 페이지 진입점에서 사용 */
export function parseRoom(v: string | string[] | undefined) {
  return typeof v === 'string' && isRoomId(v) ? v : undefined;
}
export function parseTeam(v: string | string[] | undefined) {
  const n = Number(typeof v === 'string' ? v : NaN);
  return Number.isInteger(n) && n >= 0 && n <= 9 ? n : undefined;
}

/** 시나리오(내 팀 기준 결과): win | lose | draw */
export function parseResult(v: string | string[] | undefined) {
  return v === 'win' || v === 'lose' || v === 'draw' ? v : undefined;
}
