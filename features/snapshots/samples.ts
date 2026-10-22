import type { Bet } from "@/features/events";

import type { EventDetail } from "./types";

/**
 * 지갑 단위 데이터를 읽을 수 없는 동안 눈에 띄는 베팅 화면을 보여 주기 위한 가상 이벤트.
 * 화면에는 "샘플 데이터"로 표시한다. 지갑 주소도 실제가 아니다.
 */
const MIN = 60_000;

function series(announcementAt: number, bets: Bet[], spike: boolean) {
  const points: { t: number; percent: number }[] = [];
  for (let i = 0; i < 73; i++) {
    const t = announcementAt - (72 - i) * 10 * MIN;
    let p = 0.2 + 0.012 * Math.sin(i / 5) + 0.008 * Math.sin(i / 1.7);
    for (const bet of bets) {
      if (bet.side === "yes" && bet.placedAt <= t) p += Math.min(0.03, bet.amountUsd / 1.6e6);
    }
    points.push({ t, percent: Math.round((spike && i === 72 ? 1 : p) * 1000) / 10 });
  }
  return points;
}

const SUMMIT_AT = Date.UTC(2026, 9, 9, 9, 0);
const summitBets: Bet[] = [
  { wallet: "0x4be2…a91c", side: "yes", amountUsd: 48_200, price: 0.19, placedAt: SUMMIT_AT - 130 * MIN },
  { wallet: "0x91d7…3f20", side: "yes", amountUsd: 27_500, price: 0.21, placedAt: SUMMIT_AT - 95 * MIN },
  { wallet: "0xc03a…77be", side: "yes", amountUsd: 31_000, price: 0.22, placedAt: SUMMIT_AT - 300 * MIN },
  { wallet: "0x2f68…d514", side: "no", amountUsd: 26_000, price: 0.8, placedAt: SUMMIT_AT - 1440 * MIN },
  { wallet: "0x7a15…09ce", side: "yes", amountUsd: 6_400, price: 0.22, placedAt: SUMMIT_AT - 60 * MIN },
];

const MERGER_AT = Date.UTC(2026, 11, 31, 23, 59);

export function sampleEvents(now: number): Record<string, EventDetail> {
  const mergerBets: Bet[] = [
    { wallet: "0x58aa…e3d1", side: "yes", amountUsd: 40_000, price: 0.27, placedAt: now - 95 * MIN },
    { wallet: "0xb6f0…41a7", side: "yes", amountUsd: 32_000, price: 0.25, placedAt: now - 26 * 60 * MIN },
  ];
  return {
    "sample-summit": {
      id: "sample-summit",
      title: "Will the summit end without a signed trade framework?",
      category: "politics",
      source: "Sample",
      sample: true,
      status: "resolved",
      announcementAt: SUMMIT_AT,
      resultLabel: "Yes",
      outcome: "yes",
      volume: { amount: 1_900_000, unit: "usd" },
      chart: series(SUMMIT_AT, summitBets, true),
      bets: summitBets,
    },
    "sample-merger": {
      id: "sample-merger",
      title: "Will Company A and Company B announce a merger by year end?",
      category: "business",
      source: "Sample",
      sample: true,
      status: "open",
      announcementAt: MERGER_AT,
      resultLabel: null,
      outcome: null,
      volume: { amount: 640_000, unit: "usd" },
      chart: series(now, mergerBets, false),
      bets: mergerBets,
    },
  };
}
