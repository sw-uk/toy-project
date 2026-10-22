import { describe, expect, test } from "vitest";

import { autoRefreshIntervalMs, isStale } from "@/features/refresh";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const eventAt = Date.UTC(2026, 9, 28, 18, 0);

describe("자동 갱신 주기", () => {
  test.each([
    ["이벤트 8일 전", 8 * DAY, 24 * HOUR],
    ["이벤트 6일 전", 6 * DAY, 12 * HOUR],
    ["이벤트 3일 전", 3 * DAY, 12 * HOUR],
    ["이벤트 2일 23시간 전", 3 * DAY - HOUR, 1 * HOUR],
    ["이벤트 직전", 5 * 60_000, 1 * HOUR],
  ])("%s에는 %i ms 남아 주기가 %i ms다", (_, remaining, expected) => {
    expect(autoRefreshIntervalMs(eventAt - remaining, eventAt)).toBe(expected);
  });

  test("이벤트가 끝났거나 일정이 없으면 하루에 한 번이다", () => {
    expect(autoRefreshIntervalMs(eventAt + HOUR, eventAt)).toBe(24 * HOUR);
    expect(autoRefreshIntervalMs(eventAt, null)).toBe(24 * HOUR);
  });
});

describe("저장된 데이터가 낡았는지", () => {
  test("주기가 지나면 낡았고 주기 안에서는 낡지 않았다", () => {
    const now = eventAt - 2 * DAY; // 주기 1시간
    expect(isStale(now - 59 * 60_000, now, eventAt)).toBe(false);
    expect(isStale(now - 61 * 60_000, now, eventAt)).toBe(true);
  });
});
