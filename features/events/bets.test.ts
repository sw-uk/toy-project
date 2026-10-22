import { describe, expect, test } from "vitest";

import { buildBetRows, summarizeBets } from "@/features/events";

const announcementAt = Date.UTC(2026, 10, 14, 9, 0);
const minutesBefore = (min: number) => announcementAt - min * 60_000;

describe("큰 베팅 목록", () => {
  test("2.5만 달러 미만 베팅은 목록에 넣지 않는다", () => {
    const rows = buildBetRows(
      [
        { wallet: "0xaaaa…0001", side: "yes", amountUsd: 24_999, price: 0.2, placedAt: minutesBefore(60) },
        { wallet: "0xaaaa…0002", side: "yes", amountUsd: 25_000, price: 0.2, placedAt: minutesBefore(60) },
      ],
      { announcementAt, outcome: "yes" },
    );

    expect(rows.map((row) => row.wallet)).toEqual(["0xaaaa…0002"]);
  });

  test("결과가 확정되면 맞힌 베팅은 이익, 틀린 베팅은 건 금액만큼 손실이다", () => {
    const rows = buildBetRows(
      [
        { wallet: "0xwin", side: "yes", amountUsd: 48_200, price: 0.19, placedAt: minutesBefore(130) },
        { wallet: "0xlose", side: "no", amountUsd: 26_000, price: 0.8, placedAt: minutesBefore(1440) },
      ],
      { announcementAt, outcome: "yes" },
    );

    // 48,200 / 0.19 = 253,684.2 주 → 지급액 253,684 달러, 이익 205,484 달러
    expect(rows[0]).toMatchObject({ wallet: "0xwin", profitUsd: 205_484 });
    expect(rows[1]).toMatchObject({ wallet: "0xlose", profitUsd: -26_000 });
  });

  test("결과가 확정되면 수익이 큰 순서, 이벤트 전에는 금액이 큰 순서로 보인다", () => {
    const bets = [
      { wallet: "small", side: "yes" as const, amountUsd: 30_000, price: 0.5, placedAt: minutesBefore(60) },
      { wallet: "big", side: "yes" as const, amountUsd: 50_000, price: 0.9, placedAt: minutesBefore(60) },
    ];

    // small 이익 30,000 / big 이익 5,556
    expect(
      buildBetRows(bets, { announcementAt, outcome: "yes" }).map((r) => r.wallet),
    ).toEqual(["small", "big"]);
    expect(
      buildBetRows(bets, { announcementAt, outcome: null }).map((r) => r.wallet),
    ).toEqual(["big", "small"]);
  });

  test("발표 3시간 이내에 이뤄진 큰 베팅은 따로 구분한다", () => {
    const rows = buildBetRows(
      [
        { wallet: "inside", side: "yes", amountUsd: 40_000, price: 0.2, placedAt: minutesBefore(180) },
        { wallet: "outside", side: "yes", amountUsd: 40_000, price: 0.2, placedAt: minutesBefore(181) },
      ],
      { announcementAt, outcome: "yes" },
    );

    expect(Object.fromEntries(rows.map((r) => [r.wallet, r.nearAnnouncement]))).toEqual({
      inside: true,
      outside: false,
    });
  });

  test("요약은 최대 단일 베팅과 발표 직전 큰 베팅 수를 센다", () => {
    const summary = summarizeBets(
      [
        { wallet: "a", side: "yes", amountUsd: 48_200, price: 0.19, placedAt: minutesBefore(130) },
        { wallet: "b", side: "yes", amountUsd: 27_500, price: 0.21, placedAt: minutesBefore(95) },
        { wallet: "c", side: "yes", amountUsd: 6_400, price: 0.22, placedAt: minutesBefore(60) },
        { wallet: "d", side: "no", amountUsd: 30_000, price: 0.8, placedAt: minutesBefore(1440) },
      ],
      announcementAt,
    );

    expect(summary).toEqual({ largestUsd: 48_200, bigNearAnnouncement: 2 });
  });

  test("이벤트 전에는 수익 대신 발생 시 지급액을 보여 준다", () => {
    const [row] = buildBetRows(
      [{ wallet: "0xopen", side: "yes", amountUsd: 27_500, price: 0.21, placedAt: minutesBefore(95) }],
      { announcementAt, outcome: null },
    );

    // 27,500 / 0.21 = 130,952.4
    expect(row.payoutUsd).toBe(130_952);
    expect(row.profitUsd).toBeNull();
  });
});
