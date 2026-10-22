import { InfoIcon, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EventLineChart } from "@/components/charts/event-line-chart";
import { FreshnessBar } from "@/components/shell/freshness-bar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildBetRows, summarizeBets, type BetRow } from "@/features/events";
import { bandOf } from "@/features/probability";
import { getI18n } from "@/features/i18n/server";
import { nowMs } from "@/lib/clock";
import { getEvent } from "@/features/snapshots";
import { cn } from "@/lib/utils";

const CATEGORY_KEY = {
  rates: "b_rates",
  politics: "b_politics",
  economy: "b_econ",
  business: "b_business",
  other: "b_other",
} as const;

export default async function EventPage({ params }: PageProps<"/events/[id]">) {
  const { id } = await params;
  const i18n = await getI18n();
  const { t, date, money, number } = i18n;

  let loaded;
  try {
    loaded = await getEvent(decodeURIComponent(id));
  } catch (error) {
    if (String(error).includes(" 404 ")) notFound();
    throw error;
  }
  const event = loaded.data;
  const now = nowMs();
  const open = event.status === "open";
  const bets = event.bets;
  // 아직 열려 있는 이벤트는 지금을 기준으로 "직전"을 센다.
  const referenceAt = open ? now : event.announcementAt;
  const rows: BetRow[] = bets
    ? buildBetRows(bets, { announcementAt: referenceAt, outcome: event.outcome })
    : [];
  const summary = bets ? summarizeBets(bets, referenceAt) : null;
  const resultText = event.resultLabel ?? "—";

  const when = (placedAt: number) => {
    if (open) {
      const minutes = Math.max(0, Math.round((now - placedAt) / 60_000));
      return minutes >= 1440
        ? t("placed_ago_d", { d: Math.round(minutes / 1440) })
        : t("placed_ago", { h: Math.floor(minutes / 60), m: String(minutes % 60).padStart(2, "0") });
    }
    const minutes = Math.max(0, Math.round((event.announcementAt - placedAt) / 60_000));
    return minutes >= 1440
      ? t("before_d", { d: Math.round(minutes / 1440) })
      : t("before", { h: Math.floor(minutes / 60), m: String(minutes % 60).padStart(2, "0") });
  };

  const markers = rows
    .filter((row) => row.side === "yes")
    .map((row) => ({ t: row.placedAt, size: 3 + Math.min(5, row.amountUsd / 10_000) }));

  return (
    <main className="flex flex-col gap-4">
      <FreshnessBar
        fetchedAt={loaded.fetchedAt}
        eventAt={open ? event.announcementAt : null}
        scope={`event:${event.id}`}
      />
      <Link href="/" className="w-fit text-sm text-muted-foreground">
        {t("back")}
      </Link>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{t(CATEGORY_KEY[event.category])}</Badge>
          {event.sample ? <Badge variant="outline">{t("sample")}</Badge> : null}
          {!event.sample ? <span className="text-xs text-muted-foreground">{event.source}</span> : null}
          {open ? (
            <Badge variant="outline">{t("st_open")}</Badge>
          ) : (
            <Badge>{t("st_resolved", { result: resultText })}</Badge>
          )}
        </div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight" data-testid="event-title">
          {event.title}
        </h1>
        <p className="text-muted-foreground">
          {open
            ? t("ev_open_when", { date: date(event.announcementAt) })
            : t("ev_when", { date: date(event.announcementAt) })}
        </p>
      </div>

      {event.sample ? (
        <Alert>
          <InfoIcon />
          <AlertDescription>{t("sample_note")}</AlertDescription>
        </Alert>
      ) : null}

      {bets === null ? (
        <Alert variant="destructive" data-testid="wallet-unavailable">
          <TriangleAlertIcon />
          <AlertTitle>{t("wu_title")}</AlertTitle>
          <AlertDescription>{t("wu_text")}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Stat
            label={t("s_vol")}
            value={
              event.volume.unit === "usd"
                ? money(event.volume.amount)
                : t("unit_contracts", { n: number(event.volume.amount) })
            }
          />
          <Stat label={t("s_big")} value={summary ? money(summary.largestUsd) : "—"} />
          <Stat label={t("s_n")} value={summary ? String(summary.bigNearAnnouncement) : "—"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("tl_h")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {event.chart.length >= 2 ? (
            <div className="mx-auto w-full max-w-2xl"><EventLineChart
              points={event.chart}
              announcementAt={open ? event.chart[event.chart.length - 1].t : event.announcementAt}
              markers={markers}
              label={t("tl_h")}
              hourLabel={(h) => (h === 0 ? "0" : `−${h}h`)}
            />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("tl_empty")}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <i className="inline-block size-2.5 rounded-full bg-primary" />
              {t("lg_price")}
            </span>
            {markers.length > 0 ? (
              <span className="flex items-center gap-1.5">
                <i className="inline-block size-2.5 rounded-full bg-destructive" />
                {t("lg_bet")}
              </span>
            ) : null}
            {!open ? (
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-2.5 w-0.5 bg-foreground" />
                {t("lg_ann")}
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {bets !== null ? (
        <>
          <Alert className="border-foreground">
            <InfoIcon />
            <AlertTitle>{t("obs_title")}</AlertTitle>
            <AlertDescription>{t("obs_text")}</AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-lg">{t(open ? "bets_open_h" : "bets_h")}</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {open ? t("open_note") : t("bets_note")}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("none_big")}</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <Table className="min-w-[560px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("c_wallet")}</TableHead>
                        <TableHead>{t("c_pos")}</TableHead>
                        <TableHead className="text-right">{t("c_amt")}</TableHead>
                        <TableHead className="text-right">{t("c_price")}</TableHead>
                        <TableHead>{t("c_when")}</TableHead>
                        <TableHead className="text-right">{t(open ? "c_payout" : "c_profit")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => {
                        const percent = Math.round(row.price * 100);
                        const won = row.profitUsd !== null && row.profitUsd > 0;
                        return (
                          <TableRow
                            key={`${row.wallet}-${row.placedAt}`}
                            data-testid="bet-row"
                            data-near={row.nearAnnouncement}
                            className={cn(row.nearAnnouncement && "bg-destructive/5")}
                          >
                            <TableCell className="font-mono text-xs">{row.wallet}</TableCell>
                            <TableCell>{t(row.side === "yes" ? "p_yes" : "p_no")}</TableCell>
                            <TableCell className="text-right tabular-nums">{money(row.amountUsd)}</TableCell>
                            <TableCell className="text-right tabular-nums" title={t(`band_${bandOf(percent)}`)}>
                              {percent}¢
                            </TableCell>
                            <TableCell>{when(row.placedAt)}</TableCell>
                            <TableCell
                              className={cn(
                                "text-right tabular-nums",
                                row.profitUsd === null ? "" : won ? "font-semibold" : "text-muted-foreground",
                              )}
                            >
                              {row.profitUsd === null
                                ? money(row.payoutUsd)
                                : `${won ? "+" : "−"}${money(Math.abs(row.profitUsd))}`}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <div
          data-testid="wallet-empty"
          className="flex flex-col items-center gap-1 rounded-lg border border-dashed p-6 text-center"
        >
          <h3 className="font-medium">{t("empty_t")}</h3>
          <p className="text-sm text-muted-foreground">{t("empty_x")}</p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t("pseudo")}</p>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
    </div>
  );
}
