import { BRAND_SETTINGS_UPGRADE_URL } from "@/lib/billing/subscription-plan-access";
import { I18nText } from "@hacado/i18n/components";
import Link from "next/link";

export function AppInstallUpgradeHint({
  showLink = true,
}: {
  showLink?: boolean;
}) {
  return (
    <p className="text-sm text-muted-foreground max-w-md">
      <I18nText text="common.upgradeRequired" namespace="apps" />{" "}
      {showLink ? (
        <Link
          href={BRAND_SETTINGS_UPGRADE_URL}
          className="underline font-medium"
        >
          <I18nText text="common.upgradeLink" namespace="apps" />
        </Link>
      ) : null}
    </p>
  );
}
