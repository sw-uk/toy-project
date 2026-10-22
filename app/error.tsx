"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/features/i18n/provider";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n();
  return (
    <main className="flex flex-col items-start gap-3 py-8" data-testid="load-error">
      <h1 className="font-heading text-xl font-semibold">{t("load_error_t")}</h1>
      <p className="text-muted-foreground">{t("load_error_x")}</p>
      <Button onClick={reset}>{t("retry")}</Button>
    </main>
  );
}
