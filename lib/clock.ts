/** 서버 컴포넌트에서 현재 시각이 필요할 때 쓴다(렌더 함수 안에서 Date.now()를 직접 부르지 않기 위해). */
export const nowMs = () => Date.now();

const DAY = 86_400_000;
const utcDay = (ms: number) => Math.floor(ms / DAY);

/** 목표 시각까지 남은 UTC 달력 날짜 수. 지난 날짜는 0이다. */
export function calendarDaysUntil(targetMs: number, now: number) {
  return Math.max(0, utcDay(targetMs) - utcDay(now));
}
