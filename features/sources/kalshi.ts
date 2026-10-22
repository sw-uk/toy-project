import { toPercentages } from "@/features/probability";

const BASE = "https://api.elections.kalshi.com/trade-api/v2";

export type KalshiMarket = {
  ticker: string;
  last_price_dollars?: string;
  result?: string;
  close_time?: string;
  volume_fp?: string;
  volume_24h_fp?: string;
  yes_sub_title?: string;
  status?: string;
};

export type KalshiEvent = {
  event_ticker: string;
  series_ticker?: string;
  title?: string;
  category?: string;
  strike_date?: string;
  markets?: KalshiMarket[];
  /** 2026-08-22 이전에 끝나 historical 경로에서 읽은 이벤트 */
  historical?: boolean;
};

export type Candle = { end_period_ts: number; price: Record<string, string | undefined> };

/** 연준 금리 결정 시장 이름(H25 = 25bp 인상) → 결과 */
export const outcomeOfMarket = (market: string) =>
  market.startsWith("H") && market !== "H0"
    ? ("rise" as const)
    : market === "H0"
      ? ("hold" as const)
      : ("cut" as const);

const marketName = (ticker: string) => ticker.split("-").at(-1) ?? ticker;

/** 연준 금리 결정 이벤트에서 회의 날짜와 인상·동결·인하 확률을 만든다. */
export function meetingFromEvent(event: KalshiEvent) {
  const prices = Object.fromEntries(
    (event.markets ?? []).map((m) => [
      marketName(m.ticker),
      Number(m.last_price_dollars ?? 0),
    ]),
  );
  const percent = toPercentages(prices);
  const sum = (outcome: "rise" | "hold" | "cut") =>
    Object.entries(percent)
      .filter(([name]) => outcomeOfMarket(name) === outcome)
      .reduce((total, [, value]) => total + value, 0);
  return {
    date: (event.strike_date ?? "").slice(0, 10),
    rise: sum("rise"),
    hold: sum("hold"),
    cut: sum("cut"),
  };
}

/** 확정된 연준 금리 결정 이벤트에서 실제로 일어난 시장과 결과를 찾는다. */
export function realizedFromEvent(event: KalshiEvent) {
  const winner = (event.markets ?? []).find((m) => m.result === "yes");
  if (!winner) return null;
  const market = marketName(winner.ticker);
  return { market, outcome: outcomeOfMarket(market) };
}

/** 현행 캔들(close_dollars)과 과거 캔들(close)의 종가를 모두 읽는다. */
export function candleClose(candle: Pick<Candle, "price">): number | null {
  const raw = candle.price.close_dollars ?? candle.price.close;
  if (raw === undefined || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export { marketName };

/** 429(요청 한도)이면 잠시 기다렸다가 몇 번 더 시도한다. */
async function get<T>(path: string, query: Record<string, string | number> = {}) {
  const url = new URL(BASE + path);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, String(value));
  }
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, {
      headers: { "user-agent": "PreSignal/0.1" },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    if (response.status === 429 && attempt < 4) {
      await new Promise((resolve) => setTimeout(resolve, 700 * 2 ** attempt));
      continue;
    }
    if (!response.ok) throw new Error(`Kalshi ${response.status} ${path}`);
    return (await response.json()) as T;
  }
}

export async function fetchOpenFedEvents(): Promise<KalshiEvent[]> {
  const body = await get<{ events: KalshiEvent[] }>("/events", {
    series_ticker: "KXFEDDECISION",
    status: "open",
    with_nested_markets: "true",
    limit: 20,
  });
  return body.events;
}

/** 이미 끝난 연준 금리 결정 이벤트(최근 순서 무관). 2026-08-22 이전은 historical 쪽에 있다. */
export async function fetchSettledFedEvents(): Promise<KalshiEvent[]> {
  const live = await get<{ events: KalshiEvent[] }>("/events", {
    series_ticker: "KXFEDDECISION",
    status: "settled",
    with_nested_markets: "true",
    limit: 50,
  });
  const historical: KalshiMarket[] = [];
  let cursor: string | undefined;
  do {
    const page = await get<{ markets: KalshiMarket[]; cursor?: string }>(
      "/historical/markets",
      { series_ticker: "KXFEDDECISION", limit: 200, ...(cursor ? { cursor } : {}) },
    );
    historical.push(...page.markets);
    cursor = page.cursor || undefined;
  } while (cursor);

  const byEvent = new Map<string, KalshiEvent>();
  for (const market of historical) {
    const key = (market as KalshiMarket & { event_ticker: string }).event_ticker;
    const event = byEvent.get(key) ?? { event_ticker: key, markets: [], historical: true };
    event.markets!.push(market);
    byEvent.set(key, event);
  }
  // live 목록에는 historical로 옮겨진 이벤트가 시장 없이 함께 나오므로, 시장이 있는 쪽을 쓴다.
  const events = new Map<string, KalshiEvent>();
  for (const event of live.events) {
    if ((event.markets ?? []).length > 0) events.set(event.event_ticker, event);
  }
  for (const event of byEvent.values()) {
    // historical 시장에는 strike_date가 없어 가장 이른 close_time을 회의 시각으로 쓴다
    event.strike_date = event.markets!
      .map((m) => m.close_time ?? "")
      .sort()[0];
    if (!events.has(event.event_ticker)) events.set(event.event_ticker, event);
  }
  return [...events.values()];
}

/** 시장 하나의 캔들. 현행 시장과 historical 시장의 경로가 다르다. */
export async function fetchCandles(
  ticker: string,
  range: { startSec: number; endSec: number; periodMinutes: 1 | 60 | 1440 },
  historical: boolean,
): Promise<Candle[]> {
  const series = ticker.split("-")[0];
  const path = historical
    ? `/historical/markets/${ticker}/candlesticks`
    : `/series/${series}/markets/${ticker}/candlesticks`;
  const body = await get<{ candlesticks: Candle[] }>(path, {
    start_ts: range.startSec,
    end_ts: range.endSec,
    period_interval: range.periodMinutes,
  });
  return body.candlesticks ?? [];
}

export async function fetchOpenEvents(): Promise<KalshiEvent[]> {
  const body = await get<{ events: KalshiEvent[] }>("/events", {
    status: "open",
    with_nested_markets: "true",
    limit: 200,
  });
  return body.events;
}

export async function fetchEvent(ticker: string): Promise<KalshiEvent> {
  const body = await get<{ event: KalshiEvent; markets: KalshiMarket[] }>(
    `/events/${ticker}`,
    { with_nested_markets: "true" },
  );
  return { ...body.event, markets: body.event.markets ?? body.markets };
}
