"use client";

import { PageLimitUpgradeHint } from "@/components/admin/pages/page-limit-upgrade-hint";
import { useI18n } from "@hacado/i18n/client";
import { TableToolbarActionLabel } from "@hacado/ui-admin/data-table";
import { Button } from "@hacado/ui/button";
import { Link } from "@hacado/ui/link";
import {
  TooltipResponsive,
  TooltipResponsiveContent,
  TooltipResponsiveTrigger,
} from "@hacado/ui/tooltip-responsive";
import { Lock, Plus } from "lucide-react";

export function AddPageButton({ canAddMore }: { canAddMore: boolean }) {
  const t = useI18n("admin");

  if (canAddMore) {
    return (
      <Link
        button
        href="/dashboard/pages/new"
        size="sm"
        variant="default"
        aria-label={t("pages.addNew")}
      >
        <Plus />
        <TableToolbarActionLabel>{t("pages.addNew")}</TableToolbarActionLabel>
      </Link>
    );
  }

  return (
    <TooltipResponsive>
      <TooltipResponsiveTrigger>
        <span>
          <Button
            variant="default"
            size="sm"
            disabled
            aria-label={t("pages.addNew")}
          >
            <Lock />
            <TableToolbarActionLabel>
              {t("pages.addNew")}
            </TableToolbarActionLabel>
          </Button>
        </span>
      </TooltipResponsiveTrigger>
      <TooltipResponsiveContent>
        <PageLimitUpgradeHint />
      </TooltipResponsiveContent>
    </TooltipResponsive>
  );
}
