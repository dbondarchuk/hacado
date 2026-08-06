import { BRAND_SETTINGS_UPGRADE_URL } from "@/lib/billing/subscription-plan-access";
import { useI18n } from "@hacado/i18n/client";
import { cn } from "@hacado/ui";
import Link from "next/link";

export function PageLimitUpgradeHint({
  showLink = true,
  className,
}: {
  showLink?: boolean;
  className?: string;
}) {
  const t = useI18n("admin");

  return (
    <div className={cn("text-sm max-w-md flex flex-col gap-2", className)}>
      <div>{t("pages.upgradeRequired")}</div>
      {showLink ? (
        <Link
          href={BRAND_SETTINGS_UPGRADE_URL}
          className="underline font-medium"
        >
          {t("pages.upgradeLink")}
        </Link>
      ) : null}
    </div>
  );
}
