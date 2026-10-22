import { describe, expect, test } from "vitest";

import {
  candleClose,
  meetingFromEvent,
  parseEffr,
  realizedFromEvent,
} from "@/features/sources";

// 2026-10-22 Kalshi 실측 응답에서 필요한 필드만 옮긴 것
const octEvent = {
  event_ticker: "KXFEDDECISION-26OCT",
  strike_date: "2026-10-28T18:00:00Z",
  markets: [
    { ticker: "KXFEDDECISION-26OCT-C26", last_price_dollars: "0.0100", result: "" },
    { ticker: "KXFEDDECISION-26OCT-C25", last_price_dollars: "0.0100", result: "" },
    { ticker: "KXFEDDECISION-26OCT-H0", last_price_dollars: "0.8900", result: "" },
    { ticker: "KXFEDDECISION-26OCT-H25", last_price_dollars: "0.1200", result: "" },
    { ticker: "KXFEDDECISION-26OCT-H26", last_price_dollars: "0.0100", result: "" },
  ],
};

describe("Kalshi 연준 금리 결정 이벤트", () => {
  test("마지막 체결가에서 회의 날짜와 인상·동결·인하 확률을 만든다", () => {
    expect(meetingFromEvent(octEvent)).toEqual({
      date: "2026-10-28",
      rise: 12,
      hold: 86,
      cut: 2,
    });
  });

  test("확정된 이벤트에서 실제 결과의 시장 이름을 찾는다", () => {
    const settled = {
      ...octEvent,
      markets: octEvent.markets.map((m) => ({
        ...m,
        result: m.ticker.endsWith("-H25") ? "yes" : "no",
      })),
    };

    expect(realizedFromEvent(settled)).toEqual({ market: "H25", outcome: "rise" });
  });
});

describe("캔들 가격", () => {
  test("현행과 과거 캔들의 서로 다른 필드 이름에서 종가를 읽는다", () => {
    expect(candleClose({ price: { close_dollars: "0.0200" } })).toBe(0.02);
    expect(candleClose({ price: { close: "0.0100" } })).toBe(0.01);
    expect(candleClose({ price: {} })).toBeNull();
  });
});

describe("뉴욕 연준 실효금리", () => {
  test("응답을 날짜 오름차순의 날짜와 금리로 바꾼다", () => {
    const body = {
      refRates: [
        { effectiveDate: "2026-10-20", type: "EFFR", percentRate: 3.88 },
        { effectiveDate: "2025-10-22", type: "EFFR", percentRate: 4.11 },
      ],
    };

    expect(parseEffr(body)).toEqual([
      { date: "2025-10-22", rate: 4.11 },
      { date: "2026-10-20", rate: 3.88 },
    ]);
  });
});
