import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { getI18n } from "@/features/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <main className="flex flex-col items-start gap-3 py-8" data-testid="not-found">
      <h1 className="font-heading text-xl font-semibold">{t("not_found_t")}</h1>
      <p className="text-muted-foreground">{t("not_found_x")}</p>
      <Link href="/" className={buttonVariants()}>
        {t("go_home")}
      </Link>
    </main>
  );
}
