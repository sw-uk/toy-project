import type { Bet, Side } from "@/features/events";
import type { Meeting, PastMeeting } from "@/features/rates";
import type { EffrPoint } from "@/features/sources";

export type SourceName = "Kalshi" | "NY Fed" | "Polymarket";

/** 금리 화면에서 자주 바뀌는 부분: 회의별 확률과 실효금리. */
export type RatesLive = {
  meetings: Meeting[];
  /** 다음 회의 시각(ms). 갱신 주기를 정하는 데 쓴다. */
  nextMeetingAt: number | null;
  effr: EffrPoint[];
  failedSources: SourceName[];
  /** 출처별로 마지막으로 읽는 데 성공한 시각(ms) */
  sourceOkAt: Partial<Record<SourceName, number>>;
};

/** 이미 끝난 회의의 한 달 전 확률과 결과. 하루에 한 번만 새로 만든다. */
export type RatesHistory = {
  past: (PastMeeting & { market: string })[];
};

export type HomeCard = {
  id: string;
  href: string;
  /** 번역 키 또는 출처가 준 영어 제목 */
  title: { key: string } | { text: string };
  category: "rates" | "politics" | "economy" | "business" | "other";
  source: "Kalshi" | "Polymarket" | "Sample";
  dateISO: string;
  percent: number;
  /** 선택지가 여러 개인 이벤트에서 가장 높은 선택지 이름 */
  lead: string | null;
  notableBets: number;
  sample: boolean;
};

export type ResolvedCard = {
  id: string;
  href: string;
  /** 번역 키와 값 */
  title: { key: string; date: string };
  source: "Kalshi" | "Polymarket" | "Sample";
  dateISO: string;
  /** 결과를 말하는 번역 키 */
  resultKey: string;
  monthBeforePercent: number;
  surprise: boolean;
  category: "rates" | "politics";
  sample: boolean;
};

export type HomeData = {
  upcoming: HomeCard[];
  resolved: ResolvedCard[];
  failedSources: SourceName[];
  sourceOkAt: Partial<Record<SourceName, number>>;
  /** 다음 이벤트 시각(ms). 갱신 주기를 정하는 데 쓴다. */
  nextEventAt: number | null;
};

export type EventDetail = {
  id: string;
  title: string;
  category: HomeCard["category"];
  source: "Kalshi" | "Polymarket" | "Sample";
  sample: boolean;
  status: "open" | "resolved";
  /** 결과 발표 시각 또는 마감 시각(ms) */
  announcementAt: number;
  resultLabel: string | null;
  outcome: Side | null;
  volume: { amount: number; unit: "usd" | "contracts" };
  chart: { t: number; percent: number }[];
  /** 지갑 단위 베팅. 읽을 수 없으면 null */
  bets: Bet[] | null;
};
