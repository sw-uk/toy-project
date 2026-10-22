"use client";

import { useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LOCALES, LOCALE_COOKIE, type Locale } from "@/features/i18n";
import { useI18n } from "@/features/i18n/provider";

export function LocaleSelect() {
  const { locale, t } = useI18n();
  const router = useRouter();

  return (
    <Select
      value={locale}
      items={LOCALES}
      onValueChange={(next) => {
        document.cookie = `${LOCALE_COOKIE}=${next as Locale}; path=/; max-age=31536000; samesite=lax`;
        router.refresh();
      }}
    >
      <SelectTrigger size="sm" aria-label={t("lang_label")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LOCALES.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
