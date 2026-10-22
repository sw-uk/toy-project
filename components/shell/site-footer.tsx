import { getI18n } from "@/features/i18n/server";

export async function SiteFooter() {
  const { t } = await getI18n();
  return (
    <footer className="mt-4 grid gap-1 border-t pt-3 text-xs text-muted-foreground">
      <span>{t("foot_1")}</span>
      <span>{t("foot_2")}</span>
    </footer>
  );
}
