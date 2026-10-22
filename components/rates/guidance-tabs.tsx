"use client";

import { useState } from "react";

import { DisclosureArrow } from "@/components/shell/disclosure-arrow";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/features/i18n/provider";

export type GuidanceItem = {
  intent: string;
  tab: string;
  signal: string;
  text: string;
};

/** 정기예금, 미국채, 변동금리 대출 중 선택한 항목의 시점 안내를 보여 준다. */
export function GuidanceTabs({ items }: { items: GuidanceItem[] }) {
  const { t } = useI18n();
  const [calcOpen, setCalcOpen] = useState(false);

  return (
    <Tabs defaultValue={items[0]?.intent} className="gap-3">
      <TabsList className="h-auto flex-wrap">
        {items.map((item) => (
          <TabsTrigger key={item.intent} value={item.intent}>
            {item.tab}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((item) => (
        <TabsContent key={item.intent} value={item.intent} className="flex flex-col gap-3">
          <div className="flex items-center gap-2 font-semibold">
            <span className="size-2 rounded-full bg-primary" />
            <span data-testid="signal-name">{item.signal}</span>
          </div>
          <p data-testid="guidance-text">{item.text}</p>
          <span className="w-fit rounded-md border border-dashed px-2 py-0.5 text-xs text-muted-foreground">
            {t("not_advice")}
          </span>
        </TabsContent>
      ))}
      <Collapsible open={calcOpen} onOpenChange={setCalcOpen}>
        <CollapsibleTrigger className="inline-flex items-center gap-1.5 text-sm underline underline-offset-4">
          {t("calc_btn")}
          <DisclosureArrow open={calcOpen} />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 text-sm text-muted-foreground" data-testid="calc-text">
          {t("calc_text")}
        </CollapsibleContent>
      </Collapsible>
    </Tabs>
  );
}
