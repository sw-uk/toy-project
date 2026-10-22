import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getI18n } from "@/features/i18n/server";
import type { HomeCard } from "@/features/snapshots";

const CATEGORY_KEY: Record<HomeCard["category"], string> = {
  rates: "b_rates",
  politics: "b_politics",
  economy: "b_econ",
  business: "b_business",
  other: "b_other",
};

export async function EventCard({ card }: { card: HomeCard }) {
  const { t, date } = await getI18n();
  const title = "key" in card.title ? t(card.title.key) : card.title.text;
  const wordKey = card.category === "rates" ? "rise_word" : "yes_word";
  const cta = card.category === "rates" ? "cta_rates" : card.notableBets > 0 ? "cta_bets" : "cta_event";

  return (
    <Card data-testid="event-card">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{t(CATEGORY_KEY[card.category])}</Badge>
          {card.sample ? <Badge variant="outline">{t("sample")}</Badge> : null}
          {card.notableBets > 0 ? (
            <Badge variant="destructive">
              {card.notableBets === 1 ? t("notable_one") : t("notable_n", { n: card.notableBets })}
            </Badge>
          ) : null}
          <span className="text-xs text-muted-foreground">
            {card.source === "Sample" ? "" : `${card.source} · `}
            {date(card.dateISO, "short")}
          </span>
        </div>
        <CardTitle className="text-base leading-snug">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-end gap-2">
          <span className="text-4xl leading-none font-semibold tracking-tight tabular-nums">
            {card.percent}%
          </span>
          <span className="pb-1 text-xs text-muted-foreground">
            {card.lead ? t("lead_word", { lead: card.lead }) : t(wordKey)}
          </span>
        </div>
        <Progress value={card.percent} aria-label={`${card.percent}%`} />
        {card.notableBets === 0 && card.category !== "rates" ? (
          <span className="text-xs text-muted-foreground">{t("no_notable")}</span>
        ) : null}
        <Link href={card.href} className={buttonVariants({ size: "sm", className: "self-start" })}>
          {t(cta)}
        </Link>
      </CardContent>
    </Card>
  );
}
