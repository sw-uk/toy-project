const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/**
 * 이벤트까지 남은 시간에 따른 자동 갱신 주기.
 * 7일 전까지 하루 1회, 3일 전까지 12시간, 그 뒤 1시간.
 * 이벤트가 끝났거나 일정이 없으면 하루 1회로 둔다.
 */
export function autoRefreshIntervalMs(now: number, eventAt: number | null) {
  if (eventAt === null || eventAt <= now) return DAY;
  const remaining = eventAt - now;
  if (remaining > 7 * DAY) return DAY;
  if (remaining >= 3 * DAY) return 12 * HOUR;
  return HOUR;
}

export function isStale(
  fetchedAt: number,
  now: number,
  eventAt: number | null,
) {
  return now - fetchedAt > autoRefreshIntervalMs(now, eventAt);
}
