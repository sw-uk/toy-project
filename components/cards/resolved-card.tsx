import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { bandOf } from "@/features/probability";
import { getI18n } from "@/features/i18n/server";
import type { ResolvedCard } from "@/features/snapshots";
import { cn } from "@/lib/utils";

/** 결과가 확정된 이벤트. 한 달 전 확률이 낮았던 결과는 눈에 띄게 구분한다. */
export async function ResolvedCardView({ card }: { card: ResolvedCard }) {
  const { t, date } = await getI18n();
  const band = t(`band_${bandOf(card.monthBeforePercent)}`);

  return (
    <Card
      data-testid="resolved-card"
      data-surprise={card.surprise}
      className={cn(card.surprise && "ring-2 ring-destructive")}
    >
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          {card.surprise ? <Badge variant="destructive">{t("surprise")}</Badge> : null}
          <Badge variant="secondary">{t(card.category === "rates" ? "b_rates" : "b_politics")}</Badge>
          {card.sample ? <Badge variant="outline">{t("sample")}</Badge> : null}
          <span className="text-xs text-muted-foreground">
            {card.source === "Sample" ? "" : `${card.source} · `}
            {date(card.dateISO, "short")}
          </span>
        </div>
        <CardTitle className="text-base leading-snug">
          {t(card.title.key, { date: date(card.dateISO) })}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Badge className="self-start">{t(card.resultKey)}</Badge>
        <p className={cn("text-sm", !card.surprise && "text-muted-foreground")}>
          {card.surprise
            ? t("note_surprise", { p: card.monthBeforePercent, band })
            : t("note_month", { p: card.monthBeforePercent })}
        </p>
        <Progress value={card.monthBeforePercent} aria-label={`${card.monthBeforePercent}%`} />
        <Link href={card.href} className="text-sm underline underline-offset-4">
          {t(card.category === "rates" ? "cta_rates" : "cta_event")}
        </Link>
      </CardContent>
    </Card>
  );
}
