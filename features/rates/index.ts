import { bandOf, isSurprise, type ProbabilityBand } from "@/features/probability";

/** FED 회의 하나의 결과별 확률(합 100). */
export type Meeting = {
  /** 회의 마지막 날(UTC, YYYY-MM-DD) */
  date: string;
  rise: number;
  hold: number;
  cut: number;
};

export type RateOutcome = "rise" | "hold" | "cut";

/** 이미 끝난 회의의 한 달 전 확률과 실제 결과. */
export type PastMeeting = {
  date: string;
  monthBefore: Record<string, number>;
  realized: string;
};

export type Intent = "deposit" | "treasury" | "loan";

export type GuidanceGroup = "likely" | "none" | "low";

export type Guidance = {
  band: ProbabilityBand;
  /** 문장 묶음: 인상이 유력하다, 의견이 갈린다, 가능성이 낮다 */
  group: GuidanceGroup;
  intent: Intent;
  facts: {
    rise: number;
    hold: number;
    laterPeak: { date: string; rise: number } | null;
  };
};

/** 다음 회의(첫 번째)의 인상 확률에서 시점 안내에 필요한 값을 계산한다. */
export function timingGuidance(intent: Intent, meetings: Meeting[]): Guidance {
  const [next, ...later] = meetings;
  const band = bandOf(next.rise);
  const peak = later.reduce<Meeting | null>(
    (best, meeting) => (best === null || meeting.rise > best.rise ? meeting : best),
    null,
  );
  return {
    band,
    group: band === "likely" ? "likely" : band === "none" ? "none" : "low",
    intent,
    facts: {
      rise: next.rise,
      hold: next.hold,
      laterPeak:
        peak !== null && peak.rise > next.rise
          ? { date: peak.date, rise: peak.rise }
          : null,
    },
  };
}

/** 한 달 전 가장 높은 선택지가 이 값(%) 이상일 때만 "시장이 확신했다"고 본다. */
const CONFIDENT_PERCENT = 60;

export type HistorySummary = {
  accuracy: { hit: number; total: number };
  /** 의외의 결과였던 회의 날짜 */
  surprises: string[];
  bars: {
    date: string;
    risePercent: number;
    realized: string;
    surprise: boolean;
  }[];
};

export function summarizeHistory(history: PastMeeting[]): HistorySummary {
  let hit = 0;
  let total = 0;
  const surprises: string[] = [];
  const bars: HistorySummary["bars"] = [];

  for (const meeting of history) {
    const entries = Object.entries(meeting.monthBefore);
    const [topKey, topPercent] = entries.reduce((best, entry) =>
      entry[1] > best[1] ? entry : best,
    );
    if (topPercent >= CONFIDENT_PERCENT) {
      total += 1;
      if (topKey === meeting.realized) hit += 1;
    }
    const surprise = isSurprise(meeting.monthBefore[meeting.realized] ?? 0);
    if (surprise) surprises.push(meeting.date);
    bars.push({
      date: meeting.date,
      risePercent: meeting.monthBefore.rise ?? 0,
      realized: meeting.realized,
      surprise,
    });
  }

  return { accuracy: { hit, total }, surprises, bars };
}
