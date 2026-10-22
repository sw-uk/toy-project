/** 큰 베팅으로 보는 최소 금액(달러). */
export const BIG_BET_MIN_USD = 25_000;

/** 발표 직전으로 보는 시간(밀리초). */
const NEAR_ANNOUNCEMENT_MS = 3 * 60 * 60 * 1000;

export type Side = "yes" | "no";

export type Bet = {
  wallet: string;
  side: Side;
  amountUsd: number;
  /** 매수 가격(0~1). 1주를 사는 값이며 맞히면 1달러를 받는다. */
  price: number;
  placedAt: number;
};

export type BetRow = {
  wallet: string;
  side: Side;
  amountUsd: number;
  price: number;
  placedAt: number;
  /** 결과가 확정된 이벤트의 수익. 확정 전에는 null. */
  profitUsd: number | null;
  /** 맞혔을 때 받는 금액. */
  payoutUsd: number;
  /** 발표 3시간 이내에 이뤄진 베팅인지. */
  nearAnnouncement: boolean;
};

export type BuildOptions = {
  announcementAt: number;
  /** 확정된 결과. 아직 모르면 null. */
  outcome: Side | null;
};

export function buildBetRows(bets: Bet[], options: BuildOptions): BetRow[] {
  const rows = bets
    .filter((bet) => bet.amountUsd >= BIG_BET_MIN_USD)
    .map((bet): BetRow => {
      const payout = bet.amountUsd / bet.price;
      const profit =
        options.outcome === null
          ? null
          : options.outcome === bet.side
            ? Math.round(payout - bet.amountUsd)
            : -bet.amountUsd;
      return {
        ...bet,
        profitUsd: profit,
        payoutUsd: Math.round(payout),
        nearAnnouncement: isNearAnnouncement(bet.placedAt, options.announcementAt),
      };
    });

  return rows.sort((a, b) =>
    options.outcome === null
      ? b.amountUsd - a.amountUsd
      : (b.profitUsd ?? 0) - (a.profitUsd ?? 0),
  );
}

function isNearAnnouncement(placedAt: number, announcementAt: number) {
  const before = announcementAt - placedAt;
  return before >= 0 && before <= NEAR_ANNOUNCEMENT_MS;
}

export type BetSummary = {
  largestUsd: number;
  bigNearAnnouncement: number;
};

export function summarizeBets(bets: Bet[], announcementAt: number): BetSummary {
  return {
    largestUsd: bets.reduce((max, bet) => Math.max(max, bet.amountUsd), 0),
    bigNearAnnouncement: bets.filter(
      (bet) =>
        bet.amountUsd >= BIG_BET_MIN_USD &&
        isNearAnnouncement(bet.placedAt, announcementAt),
    ).length,
  };
}
