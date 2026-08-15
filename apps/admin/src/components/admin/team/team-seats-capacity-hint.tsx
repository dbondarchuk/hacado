"use client";

import { BRAND_SETTINGS_UPGRADE_URL } from "@/lib/billing/subscription-plan-access";
import { useI18n } from "@hacado/i18n/client";
import { cn } from "@hacado/ui";
import Link from "next/link";

export function TeamSeatsCapacityHint({
  allowAdditionalUsers,
  className,
}: {
  allowAdditionalUsers: boolean;
  className?: string;
}) {
  const t = useI18n("admin");

  if (allowAdditionalUsers) {
    return (
      <p className={cn("text-sm text-amber-600", className)}>
        {t("team.noSlots")}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "text-sm text-amber-600 max-w-md flex flex-col gap-1",
        className,
      )}
    >
      <p>{t("team.upgradeRequired")}</p>
      <Link
        href={BRAND_SETTINGS_UPGRADE_URL}
        className="underline font-medium text-amber-700"
      >
        {t("team.upgradeLink")}
      </Link>
    </div>
  );
}
