export type ProbabilityBand =
  | "likely"
  | "none"
  | "low"
  | "unusual"
  | "veryUnusual";

/** 한 달 전 확률이 이 값(%) 미만이었는데 일어난 결과를 의외의 결과로 본다. */
const SURPRISE_BELOW_PERCENT = 10;

export function isSurprise(monthBeforePercent: number): boolean {
  return monthBeforePercent < SURPRISE_BELOW_PERCENT;
}

/**
 * 선택지별 마지막 체결 가격을 합이 정확히 100인 정수 확률로 바꾼다.
 * 가격 합이 1이 아닐 수 있어 비율로 나눈 뒤 최대 잔여 방식으로 반올림한다.
 */
export function toPercentages(
  prices: Record<string, number>,
): Record<string, number> {
  const keys = Object.keys(prices);
  const total = keys.reduce((sum, key) => sum + prices[key], 0);
  if (total <= 0) return Object.fromEntries(keys.map((key) => [key, 0]));

  const exact = keys.map((key) => ({ key, value: (prices[key] / total) * 100 }));
  const floors = exact.map(({ key, value }) => ({
    key,
    floor: Math.floor(value),
    rest: value - Math.floor(value),
  }));
  let left = 100 - floors.reduce((sum, item) => sum + item.floor, 0);
  const byRest = [...floors].sort((a, b) => b.rest - a.rest);
  const bonus = new Set<string>();
  for (const item of byRest) {
    if (left <= 0) break;
    bonus.add(item.key);
    left -= 1;
  }
  return Object.fromEntries(
    floors.map(({ key, floor }) => [key, floor + (bonus.has(key) ? 1 : 0)]),
  );
}

/** 확률(0~100)을 확률 구간 이름으로 바꾼다. */
export function bandOf(percent: number): ProbabilityBand {
  if (percent >= 60) return "likely";
  if (percent >= 40) return "none";
  if (percent >= 5) return "low";
  if (percent >= 1) return "unusual";
  return "veryUnusual";
}
