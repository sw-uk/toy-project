"use client";

import { useState } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/features/i18n/provider";

/** 동결·인하 확률은 사용자가 눌러야 펼쳐진다. */
export function HoldCutToggle({ hold, cut }: { hold: number; cut: number }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="text-sm underline underline-offset-4">
        {t(open ? "hide_more" : "show_more")}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 grid gap-2" data-testid="hold-cut">
        {[
          { label: t("w_hold"), value: hold },
          { label: t("w_cut"), value: cut },
        ].map((row) => (
          <div key={row.label} className="grid grid-cols-[56px_1fr_40px] items-center gap-3 text-sm">
            <span>{row.label}</span>
            <Progress value={row.value} aria-label={`${row.label} ${row.value}%`} />
            <span className="text-right tabular-nums">{row.value}%</span>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
