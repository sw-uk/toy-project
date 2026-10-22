import { describe, expect, test } from "vitest";

import {
  summarizeHistory,
  timingGuidance,
  type Meeting,
  type PastMeeting,
} from "@/features/rates";

const meetings: Meeting[] = [
  { date: "2026-10-28", rise: 12, hold: 86, cut: 2 },
  { date: "2026-12-09", rise: 76, hold: 21, cut: 3 },
  { date: "2027-01-27", rise: 42, hold: 53, cut: 5 },
  { date: "2027-03-17", rise: 62, hold: 31, cut: 7 },
];

describe("시점 안내", () => {
  test("신호 이름은 다음 회의의 인상 확률에서 정해진다", () => {
    expect(timingGuidance("deposit", meetings).band).toBe("low");
    expect(
      timingGuidance("deposit", [{ ...meetings[0], rise: 65 }]).band,
    ).toBe("likely");
    expect(
      timingGuidance("deposit", [{ ...meetings[0], rise: 3 }]).band,
    ).toBe("unusual");
  });

  test("문장에 쓸 숫자는 다음 회의의 인상·동결 확률과 이후 가장 높은 인상 확률이다", () => {
    expect(timingGuidance("loan", meetings).facts).toEqual({
      rise: 12,
      hold: 86,
      laterPeak: { date: "2026-12-09", rise: 76 },
    });
  });

  test("이후 회의가 더 높지 않으면 이후 최고 확률은 없다", () => {
    expect(
      timingGuidance("loan", [meetings[1], meetings[0]]).facts.laterPeak,
    ).toBeNull();
  });

  test("신호 구간은 문장 묶음(크다, 갈린다, 낮다)으로 정리된다", () => {
    const group = (rise: number) =>
      timingGuidance("deposit", [{ date: "2026-10-28", rise, hold: 100 - rise, cut: 0 }]).group;

    expect(group(60)).toBe("likely");
    expect(group(45)).toBe("none");
    expect(group(12)).toBe("low");
    expect(group(0.5)).toBe("low");
  });
});

const past = (
  date: string,
  monthBefore: Record<string, number>,
  realized: string,
): PastMeeting => ({ date, monthBefore, realized });

describe("과거 회의 요약", () => {
  const history: PastMeeting[] = [
    past("2026-01-28", { rise: 4, hold: 94, cut: 2 }, "hold"), // 적중
    past("2026-03-18", { rise: 2, hold: 95, cut: 3 }, "hold"), // 적중
    past("2026-06-10", { rise: 45, hold: 50, cut: 5 }, "hold"), // 60% 미만이라 제외
    past("2026-07-29", { rise: 5, hold: 90, cut: 5 }, "cut"), // 60% 이상인데 빗나감
    past("2026-09-16", { rise: 7, hold: 90, cut: 3 }, "rise"), // 빗나감이며 의외의 결과
  ];

  test("한 달 전 가장 높았던 선택지가 60% 이상일 때만 적중을 센다", () => {
    expect(summarizeHistory(history).accuracy).toEqual({ hit: 2, total: 4 });
  });

  test("한 달 전 확률이 10% 미만이었는데 일어난 회의를 의외의 결과로 가려낸다", () => {
    expect(summarizeHistory(history).surprises).toEqual([
      "2026-07-29",
      "2026-09-16",
    ]);
  });

  test("회의별 한 달 전 인상 확률과 결과를 그래프용으로 돌려준다", () => {
    expect(summarizeHistory(history).bars.at(-1)).toEqual({
      date: "2026-09-16",
      risePercent: 7,
      realized: "rise",
      surprise: true,
    });
  });
});
