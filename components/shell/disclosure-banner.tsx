import { InfoIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { getI18n } from "@/features/i18n/server";

/** 모든 화면 위에 항상 보이는 고지. 투자 권유가 아니라는 점을 가장 먼저 알린다. */
export async function DisclosureBanner() {
  const { t } = await getI18n();
  return (
    <Alert role="note" className="border-foreground">
      <InfoIcon />
      <AlertDescription
        className="text-foreground [&_b]:font-semibold"
        dangerouslySetInnerHTML={{ __html: t("disc_text") }}
      />
    </Alert>
  );
}
