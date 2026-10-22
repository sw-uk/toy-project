import { autoRefreshIntervalMs } from "@/features/refresh";
import { getI18n } from "@/features/i18n/server";
import { calendarDaysUntil, nowMs } from "@/lib/clock";

import { RefreshButton } from "./refresh-button";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** 마지막 갱신 시각, 현재 갱신 주기, 지금 새로 고침을 보여 준다. */
export async function FreshnessBar({
  fetchedAt,
  eventAt,
  scope,
}: {
  fetchedAt: number;
  eventAt: number | null;
  scope: string;
}) {
  const { t, ago } = await getI18n();
  const now = nowMs();
  const interval = autoRefreshIntervalMs(now, eventAt);
  const every = t(interval >= DAY ? "every_24h" : interval >= 12 * HOUR ? "every_12h" : "every_1h");

  let text: string;
  if (eventAt !== null && eventAt > now) {
    const days = calendarDaysUntil(eventAt, now);
    const left = days === 0 ? t("today") : days === 1 ? t("days_1") : t("days_n", { n: days });
    text = t("fresh", { ago: ago(now - fetchedAt), every, days: left });
  } else {
    text = t("fresh_noevent", { ago: ago(now - fetchedAt), every });
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
      <span className="flex items-center gap-2">
        <span className="size-2 flex-none rounded-full bg-primary" />
        <span>{text}</span>
      </span>
      <RefreshButton scope={scope} />
    </div>
  );
}
