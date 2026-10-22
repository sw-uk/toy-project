import { candleClose, fetchCandles, fetchEvent } from "@/features/sources";

import { categoryOf } from "./build-home";
import { sampleEvents } from "./samples";
import type { EventDetail } from "./types";

/** historical 경로로 옮겨지는 기준 시각(Kalshi가 알려 준 값). */
const HISTORICAL_CUTOFF = Date.UTC(2026, 7, 22);
const HOUR = 3_600_000;

/** 이벤트 하나의 상세. 지갑 정보는 아직 읽을 수 없어 null로 둔다. */
export async function buildEvent(id: string, now: number): Promise<EventDetail> {
  const sample = sampleEvents(now)[id];
  if (sample) return sample;

  const event = await fetchEvent(id);
  const markets = event.markets ?? [];
  if (markets.length === 0) throw new Error(`Kalshi event ${id} has no markets`);

  const lead = markets.reduce((a, b) =>
    Number(b.last_price_dollars) > Number(a.last_price_dollars) ? b : a,
  );
  const winner = markets.find((m) => m.result === "yes");
  const resolved = winner !== undefined || markets.every((m) => m.result);
  const closes = markets.map((m) => Date.parse(m.close_time ?? "")).filter(Number.isFinite);
  const announcementAt = Math.min(...closes);

  const endMs = resolved ? announcementAt : now;
  let chart: EventDetail["chart"] = [];
  try {
    const candles = await fetchCandles(
      lead.ticker,
      {
        startSec: Math.floor((endMs - 12 * HOUR) / 1000),
        endSec: Math.floor(endMs / 1000),
        periodMinutes: 60,
      },
      resolved && endMs < HISTORICAL_CUTOFF,
    );
    chart = candles.flatMap((candle) => {
      const close = candleClose(candle);
      return close === null
        ? []
        : [{ t: candle.end_period_ts * 1000, percent: Math.round(close * 1000) / 10 }];
    });
  } catch {
    chart = [];
  }

  return {
    id,
    title: event.title ?? id,
    category: categoryOf(event.category),
    source: "Kalshi",
    sample: false,
    status: resolved ? "resolved" : "open",
    announcementAt,
    resultLabel: winner?.yes_sub_title ?? null,
    outcome: null,
    volume: {
      amount: Math.round(markets.reduce((sum, m) => sum + Number(m.volume_fp ?? 0), 0)),
      unit: "contracts",
    },
    chart,
    bets: null,
  };
}
