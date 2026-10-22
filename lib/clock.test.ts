import { describe, expect, test } from "vitest";

import { calendarDaysUntil } from "@/lib/clock";

describe("남은 날짜", () => {
  test("시각이 아니라 UTC 달력 날짜의 차이로 센다", () => {
    const now = Date.UTC(2026, 9, 22, 15, 0);

    expect(calendarDaysUntil(Date.UTC(2026, 9, 28, 18, 0), now)).toBe(6);
    expect(calendarDaysUntil(Date.UTC(2026, 9, 23, 0, 30), now)).toBe(1);
    expect(calendarDaysUntil(Date.UTC(2026, 9, 22, 23, 0), now)).toBe(0);
  });

  test("이미 지난 날짜는 0으로 둔다", () => {
    expect(calendarDaysUntil(Date.UTC(2026, 9, 20), Date.UTC(2026, 9, 22))).toBe(0);
  });
});
