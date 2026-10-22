import { summarizeBets } from "@/features/events";
import { isSurprise } from "@/features/probability";
import { summarizeHistory } from "@/features/rates";
import { fetchOpenEvents, type KalshiEvent } from "@/features/sources";

import { sampleEvents } from "./samples";
import type {
  EventDetail,
  HomeCard,
  HomeData,
  RatesHistory,
  RatesLive,
  ResolvedCard,
  SourceName,
} from "./types";

const OTHER_CARDS = 3;
/** 샘플 이벤트(정상회담)의 한 달 전 확률. 의외의 결과 표시를 보여 주려고 낮게 둔 가상의 값. */
const SUMMIT_MONTH_BEFORE_PERCENT = 7;
/** 홈에는 앞으로 이 기간 안에 마감되는 이벤트만 올린다. */
const HORIZON_MS = 120 * 86_400_000;

/** Kalshi 카테고리를 화면에 쓰는 분류로 바꾼다. */
export function categoryOf(kalshiCategory: string | undefined): HomeCard["category"] {
  if (kalshiCategory === "Politics" || kalshiCategory === "Elections") return "politics";
  if (kalshiCategory === "Economics" || kalshiCategory === "Financials") return "economy";
  if (kalshiCategory === "Companies") return "business";
  return "other";
}

const FEATURED = new Set(["Politics", "Elections", "Economics", "Financials", "Companies"]);

function cardFromKalshi(event: KalshiEvent, now: number): HomeCard | null {
  const markets = (event.markets ?? []).filter((m) => Number(m.last_price_dollars) > 0);
  if (markets.length === 0) return null;
  const closeAt = Math.min(...markets.map((m) => Date.parse(m.close_time ?? "")));
  if (!(closeAt > now && closeAt <= now + HORIZON_MS)) return null;
  const lead = markets.reduce((a, b) =>
    Number(b.last_price_dollars) > Number(a.last_price_dollars) ? b : a,
  );
  const closes = markets.map((m) => m.close_time ?? "").sort();
  return {
    id: event.event_ticker,
    href: `/events/${event.event_ticker}`,
    title: { text: event.title ?? event.event_ticker },
    category: categoryOf(event.category),
    source: "Kalshi",
    dateISO: (event.strike_date ?? closes[0] ?? "").slice(0, 10),
    percent: Math.round(Number(lead.last_price_dollars) * 100),
    lead: markets.length > 1 ? (lead.yes_sub_title ?? null) : null,
    notableBets: 0,
    sample: false,
  };
}

function sampleCard(event: EventDetail, now: number): HomeCard {
  const last = event.chart[event.chart.length - 1];
  return {
    id: event.id,
    href: `/events/${event.id}`,
    title: { text: event.title },
    category: event.category,
    source: "Sample",
    dateISO: new Date(event.announcementAt).toISOString().slice(0, 10),
    percent: Math.round(last.percent),
    lead: null,
    // 아직 열려 있는 이벤트는 지금을 기준으로 "직전"을 센다.
    notableBets: summarizeBets(event.bets ?? [], event.status === "open" ? now : event.announcementAt)
      .bigNearAnnouncement,
    sample: true,
  };
}

/** 홈에 보일 진행 예정 이벤트와 결과 확정 이벤트를 모은다. */
export async function buildHome(
  now: number,
  rates: { live: RatesLive; history: RatesHistory },
): Promise<HomeData> {
  const failedSources: SourceName[] = [...rates.live.failedSources];
  const sourceOkAt: HomeData["sourceOkAt"] = { ...rates.live.sourceOkAt };
  const samples = sampleEvents(now);

  const upcoming: HomeCard[] = [];
  const next = rates.live.meetings[0];
  if (next) {
    upcoming.push({
      id: "rates",
      href: "/rates",
      title: { key: "c1_t" },
      category: "rates",
      source: "Kalshi",
      dateISO: next.date,
      percent: next.rise,
      lead: null,
      notableBets: 0,
      sample: false,
    });
  }

  try {
    const events = await fetchOpenEvents();
    const others = events
      .filter((e) => !e.event_ticker.startsWith("KXFED") && FEATURED.has(e.category ?? ""))
      .map((event) => ({
        card: cardFromKalshi(event, now),
        volume: (event.markets ?? []).reduce((sum, m) => sum + Number(m.volume_24h_fp ?? 0), 0),
      }))
      .filter((entry): entry is { card: HomeCard; volume: number } => entry.card !== null)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, OTHER_CARDS)
      .map((entry) => entry.card);
    upcoming.push(...others);
    sourceOkAt.Kalshi = now;
  } catch {
    failedSources.push("Kalshi");
  }

  upcoming.push(sampleCard(samples["sample-merger"], now));
  // 눈에 띄는 베팅이 있는 이벤트를 먼저 보여 준다.
  upcoming.sort((a, b) => Number(b.notableBets > 0) - Number(a.notableBets > 0));

  const summary = summarizeHistory(rates.history.past);
  const resolved: ResolvedCard[] = rates.history.past
    .slice(-3)
    .reverse()
    .map((meeting) => ({
      id: `rates-${meeting.date}`,
      href: "/rates",
      title: { key: "r_fed_t", date: meeting.date },
      source: "Kalshi",
      dateISO: meeting.date,
      resultKey: `res_${meeting.market}`,
      monthBeforePercent: meeting.monthBefore[meeting.realized] ?? 0,
      surprise: summary.surprises.includes(meeting.date),
      category: "rates",
      sample: false,
    }));
  const summit = samples["sample-summit"];
  resolved.push({
    id: summit.id,
    href: `/events/${summit.id}`,
    title: { key: "r_summit_t", date: "" },
    source: "Sample",
    dateISO: new Date(summit.announcementAt).toISOString().slice(0, 10),
    resultKey: "res_yes",
    monthBeforePercent: SUMMIT_MONTH_BEFORE_PERCENT,
    surprise: isSurprise(SUMMIT_MONTH_BEFORE_PERCENT),
    category: "politics",
    sample: true,
  });
  resolved.sort((a, b) => Number(b.surprise) - Number(a.surprise));

  const nextEventAt = next
    ? (rates.live.nextMeetingAt ?? Date.parse(next.date))
    : null;
  return {
    upcoming,
    resolved,
    failedSources: [...new Set(failedSources)],
    sourceOkAt,
    nextEventAt,
  };
}
