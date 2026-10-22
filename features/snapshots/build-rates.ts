import { toPercentages } from "@/features/probability";
import type { Meeting } from "@/features/rates";
import {
  candleClose,
  fetchCandles,
  fetchEffr,
  fetchOpenFedEvents,
  fetchSettledFedEvents,
  marketName,
  meetingFromEvent,
  outcomeOfMarket,
  realizedFromEvent,
  type KalshiEvent,
} from "@/features/sources";

import type { RatesHistory, RatesLive, SourceName } from "./types";

const DAY = 86_400_000;
const PAST_MEETINGS_TO_KEEP = 14;

const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** 향후 6개월 회의의 확률과 최근 1년의 실효금리. 한쪽이 실패하면 이전 값을 유지한다. */
export async function buildRatesLive(
  now: number,
  previous: RatesLive | null,
): Promise<RatesLive> {
  const [events, effr] = await Promise.allSettled([
    fetchOpenFedEvents(),
    fetchEffr(isoDate(now - 365 * DAY), isoDate(now)),
  ]);
  const failedSources: SourceName[] = [];
  let meetings: Meeting[] = previous?.meetings ?? [];
  let nextMeetingAt = previous?.nextMeetingAt ?? null;
  let effrPoints = previous?.effr ?? [];
  const sourceOkAt: RatesLive["sourceOkAt"] = { ...previous?.sourceOkAt };

  if (events.status === "fulfilled") {
    const upcoming = events.value
      .filter((e) => e.strike_date && Date.parse(e.strike_date) >= now - DAY)
      .filter((e) => Date.parse(e.strike_date!) <= now + 183 * DAY)
      .sort((a, b) => a.strike_date!.localeCompare(b.strike_date!));
    meetings = upcoming.map(meetingFromEvent);
    nextMeetingAt = upcoming[0] ? Date.parse(upcoming[0].strike_date!) : null;
    sourceOkAt.Kalshi = now;
  } else {
    failedSources.push("Kalshi");
  }
  if (effr.status === "fulfilled") {
    effrPoints = effr.value;
    sourceOkAt["NY Fed"] = now;
  } else {
    failedSources.push("NY Fed");
  }

  if (failedSources.length === 2 && !previous) {
    throw new Error("Kalshi and NY Fed both failed");
  }
  return { meetings, nextMeetingAt, effr: effrPoints, failedSources, sourceOkAt };
}

const closeMs = (event: KalshiEvent) =>
  Math.min(
    ...(event.markets ?? []).map((m) => Date.parse(m.close_time ?? "")).filter(Number.isFinite),
  );

async function monthBefore(event: KalshiEvent) {
  const closeSec = Math.floor(closeMs(event) / 1000);
  const prices: Record<string, number> = {};
  // Kalshi 요청 한도를 넘지 않도록 하나씩 요청한다. 하루에 한 번 만드는 이력이라 느려도 된다.
  for (const market of event.markets ?? []) {
    const candles = await fetchCandles(
      market.ticker,
      { startSec: closeSec - 33 * 86_400, endSec: closeSec - 30 * 86_400, periodMinutes: 1440 },
      event.historical === true,
    );
    const price = candles.length ? candleClose(candles[candles.length - 1]) : null;
    if (price !== null) prices[marketName(market.ticker)] = price;
  }
  if (Object.keys(prices).length === 0) return null;
  const percent = toPercentages(prices);
  const sum = (outcome: "rise" | "hold" | "cut") =>
    Object.entries(percent)
      .filter(([name]) => outcomeOfMarket(name) === outcome)
      .reduce((total, [, value]) => total + value, 0);
  return { rise: sum("rise"), hold: sum("hold"), cut: sum("cut") };
}

/** 최근 회의들의 한 달 전 확률과 실제 결과. */
export async function buildRatesHistory(): Promise<RatesHistory> {
  const events = (await fetchSettledFedEvents())
    .filter((e) => Number.isFinite(closeMs(e)))
    .sort((a, b) => closeMs(b) - closeMs(a))
    .slice(0, PAST_MEETINGS_TO_KEEP);

  const past: RatesHistory["past"] = [];
  for (const event of events) {
    const realized = realizedFromEvent(event);
    if (!realized) continue;
    let before: Awaited<ReturnType<typeof monthBefore>>;
    try {
      before = await monthBefore(event);
    } catch {
      continue; // 한 회의를 못 읽어도 나머지 이력은 보여 준다
    }
    if (!before) continue;
    past.push({
      date: isoDate(closeMs(event)),
      monthBefore: before,
      realized: realized.outcome,
      market: realized.market,
    });
  }
  return { past: past.sort((a, b) => a.date.localeCompare(b.date)) };
}
