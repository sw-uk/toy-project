import { InfoIcon, TriangleAlertIcon } from "lucide-react";

import { ProbabilityBars } from "@/components/charts/probability-bars";
import { RateStepChart } from "@/components/charts/rate-step-chart";
import { HoldCutToggle } from "@/components/rates/hold-cut-toggle";
import { GuidanceTabs, type GuidanceItem } from "@/components/rates/guidance-tabs";
import { MeetingsTable } from "@/components/rates/meetings-table";
import { FreshnessBar } from "@/components/shell/freshness-bar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getI18n } from "@/features/i18n/server";
import { calendarDaysUntil, nowMs } from "@/lib/clock";
import { summarizeHistory, timingGuidance, type Intent } from "@/features/rates";
import { getRates } from "@/features/snapshots";

const INTENTS: { intent: Intent; tab: string }[] = [
  { intent: "deposit", tab: "tab_dep" },
  { intent: "treasury", tab: "tab_tsy" },
  { intent: "loan", tab: "tab_loan" },
];

export default async function RatesPage() {
  const i18n = await getI18n();
  const { t, date, ago } = i18n;
  const { live, history } = await getRates();
  const { meetings, effr, nextMeetingAt, failedSources, sourceOkAt } = live.data;
  const past = history.data.past;
  const summary = summarizeHistory(past);
  const next = meetings[0];
  const lastRate = effr.at(-1);
  const lastMeeting = past.at(-1);
  const degraded = live.failed || history.failed || failedSources.length > 0;
  const now = nowMs();
  const lastOkAt = Math.min(...failedSources.map((s) => sourceOkAt[s] ?? live.fetchedAt), live.fetchedAt);

  const inText = (iso: string) => {
    const days = calendarDaysUntil(Date.parse(`${iso}T18:00:00Z`), now);
    return days === 0 ? t("today") : days === 1 ? t("in_day") : t("in_days", { n: days });
  };

  const guidance: GuidanceItem[] = next
    ? INTENTS.map(({ intent, tab }) => {
        const g = timingGuidance(intent, meetings);
        const later =
          g.facts.laterPeak && g.group !== "likely"
            ? ` ${t("guide_later", { date: date(g.facts.laterPeak.date, "short"), rise: g.facts.laterPeak.rise })}`
            : "";
        return {
          intent,
          tab: t(tab),
          signal: t(`sig_${g.band}`),
          text: t(`guide_${intent}_${g.group}`, { rise: g.facts.rise, hold: g.facts.hold }) + later,
        };
      })
    : [];

  return (
    <main className="flex flex-col gap-4">
      <FreshnessBar fetchedAt={live.fetchedAt} eventAt={nextMeetingAt} scope="rates" />
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{t("rates_h1")}</h1>
        {lastMeeting && lastRate ? (
          <p className="text-muted-foreground">
            {t("last_decision", {
              date: date(lastMeeting.date),
              move: t(`lm_${lastMeeting.market}`),
              rate: lastRate.rate.toFixed(2),
            })}
          </p>
        ) : null}
      </div>

      {degraded ? (
        <Alert variant="destructive" data-testid="refresh-failed">
          <TriangleAlertIcon />
          <AlertTitle>{t("rf_title")}</AlertTitle>
          <AlertDescription>{t("rf_text", { ago: ago(now - lastOkAt) })}</AlertDescription>
        </Alert>
      ) : null}

      {next ? (
        <Card>
          <CardHeader>
            <div className="text-xs text-muted-foreground">{t("next_meeting")}</div>
            <CardTitle className="text-lg">
              {date(next.date, "full")} · <span className="text-muted-foreground">{inText(next.date)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-end gap-3">
              <span className="text-5xl leading-none font-semibold tracking-tight tabular-nums" data-testid="next-rise">
                {next.rise}%
              </span>
              <span className="pb-1 text-muted-foreground">{t("rise_label")}</span>
            </div>
            <Progress value={next.rise} aria-label={`${next.rise}%`} />
            <HoldCutToggle hold={next.hold} cut={next.cut} />
          </CardContent>
        </Card>
      ) : null}

      <Alert className="border-foreground">
        <InfoIcon />
        <AlertTitle>{t("read_title")}</AlertTitle>
        <AlertDescription>
          <ul className="mt-1 list-disc pl-5">
            <li>{t("read_1")}</li>
            <li>{t("read_2")}</li>
            <li>{t("read_3")}</li>
          </ul>
        </AlertDescription>
      </Alert>

      {guidance.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("intents_h")}</CardTitle>
          </CardHeader>
          <CardContent>
            <GuidanceTabs items={guidance} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("acc_h")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {summary.accuracy.total > 0 ? (
            <>
              <p>
                {t("acc_text", {
                  hit: summary.accuracy.hit,
                  total: summary.accuracy.total,
                  n: past.length,
                })}
              </p>
              <Progress
                value={(summary.accuracy.hit / summary.accuracy.total) * 100}
                aria-label={`${summary.accuracy.hit} / ${summary.accuracy.total}`}
              />
            </>
          ) : (
            <p className="text-muted-foreground">{t("acc_none")}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("chart1_h")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <RateStepChart
              points={effr}
              label={t("chart1_h")}
              monthLabel={(iso) =>
                new Intl.DateTimeFormat(i18n.tag, { month: "short", timeZone: "UTC" }).format(
                  new Date(`${iso}T12:00:00Z`),
                )
              }
            />
            <span className="text-xs text-muted-foreground">{t("lg_rate")}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("chart2_h")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <ProbabilityBars
              label={t("chart2_h")}
              bars={summary.bars.slice(-8).map((bar) => ({
                key: bar.date,
                label: date(bar.date, "short"),
                percent: bar.risePercent,
                surprise: bar.surprise,
              }))}
            />
            <span className="flex flex-wrap items-center gap-x-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <i className="inline-block size-2.5 rounded-full bg-destructive" />
                {t("lg_surprise")}
              </span>
            </span>
          </CardContent>
        </Card>
      </div>

      {meetings.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("tbl_h")}</CardTitle>
          </CardHeader>
          <CardContent>
            <MeetingsTable
              rows={meetings.map((m) => ({
                date: date(m.date),
                inText: inText(m.date),
                rise: m.rise,
                hold: m.hold,
                cut: m.cut,
              }))}
            />
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
