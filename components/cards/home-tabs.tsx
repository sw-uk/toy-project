"use client";

import type { ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/features/i18n/provider";

/** 진행 예정과 결과 확정을 나눠 보여 주는 탭. 목록은 서버에서 그려서 받는다. */
export function HomeTabs({ upcoming, resolved }: { upcoming: ReactNode; resolved: ReactNode }) {
  const { t } = useI18n();
  return (
    <Tabs defaultValue="up" className="gap-3">
      <TabsList>
        <TabsTrigger value="up">{t("seg_up")}</TabsTrigger>
        <TabsTrigger value="res">{t("seg_res")}</TabsTrigger>
      </TabsList>
      <TabsContent value="up">{upcoming}</TabsContent>
      <TabsContent value="res">{resolved}</TabsContent>
    </Tabs>
  );
}
