import { TriangleAlertIcon } from "lucide-react";

import { EventCard } from "@/components/cards/event-card";
import { HomeTabs } from "@/components/cards/home-tabs";
import { ResolvedCardView } from "@/components/cards/resolved-card";
import { FreshnessBar } from "@/components/shell/freshness-bar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getI18n } from "@/features/i18n/server";
import { nowMs } from "@/lib/clock";
import { getHome } from "@/features/snapshots";

export default async function Home() {
  const { t, ago } = await getI18n();
  const home = await getHome();
  const { upcoming, resolved, failedSources, nextEventAt, sourceOkAt } = home.data;
  const lastOkAt = Math.min(...failedSources.map((s) => sourceOkAt[s] ?? home.fetchedAt), home.fetchedAt);
  const degraded = home.failed || failedSources.length > 0;

  return (
    <main className="flex flex-col gap-4">
      <FreshnessBar fetchedAt={home.fetchedAt} eventAt={nextEventAt} scope="home" />
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{t("home_h1")}</h1>
        <p className="text-muted-foreground">{t("home_sub")}</p>
      </div>

      {degraded ? (
        <Alert variant="destructive" data-testid="source-alert">
          <TriangleAlertIcon />
          <AlertTitle>{t("su_title")}</AlertTitle>
          <AlertDescription>
            {t("su_text", {
              sources: failedSources.length ? failedSources.join(", ") : "Kalshi",
              ago: ago(nowMs() - lastOkAt),
            })}
          </AlertDescription>
        </Alert>
      ) : null}

      <HomeTabs
        upcoming={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((card) => (
              <EventCard key={card.id} card={card} />
            ))}
          </div>
        }
        resolved={
          resolved.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {resolved.map((card) => (
                <ResolvedCardView key={card.id} card={card} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">{t("empty_list")}</p>
          )
        }
      />
    </main>
  );
}
