import { describe, expect, test } from "vitest";

import { bandOf, isSurprise, toPercentages } from "@/features/probability";

describe("선택지 확률 보정", () => {
  test("마지막 체결 가격의 합이 100%가 아니어도 정수 확률의 합이 100이 된다", () => {
    // 2026-10 FED 회의 시장의 실측 마지막 체결가(합 1.04)
    const prices = { H25: 0.12, H0: 0.89, C25: 0.01, H26: 0.01, C26: 0.01 };

    expect(toPercentages(prices)).toEqual({
      H25: 11,
      H0: 86,
      C25: 1,
      H26: 1,
      C26: 1,
    });
  });

  test("가격이 모두 0이면 모든 확률이 0이다", () => {
    expect(toPercentages({ yes: 0, no: 0 })).toEqual({ yes: 0, no: 0 });
  });
});

describe("의외의 결과", () => {
  test("한 달 전 확률이 10% 미만이었던 결과만 의외의 결과다", () => {
    expect(isSurprise(9.9)).toBe(true);
    expect(isSurprise(10)).toBe(false);
  });
});

describe("확률 구간 이름", () => {
  test.each([
    [100, "likely"],
    [60, "likely"],
    [59, "none"],
    [40, "none"],
    [39, "low"],
    [12, "low"],
    [5, "low"],
    [4.9, "unusual"],
    [1, "unusual"],
    [0.9, "veryUnusual"],
    [0, "veryUnusual"],
  ])("확률 %s%%는 %s 구간이다", (percent, band) => {
    expect(bandOf(percent)).toBe(band);
  });
});
