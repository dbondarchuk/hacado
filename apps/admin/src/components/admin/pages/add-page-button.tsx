"use client";

import { PageLimitUpgradeHint } from "@/components/admin/pages/page-limit-upgrade-hint";
import { useI18n } from "@timelish/i18n/client";
import {
  Button,
  Link,
  TooltipResponsive,
  TooltipResponsiveContent,
  TooltipResponsiveTrigger,
} from "@timelish/ui";
import { Lock, Plus } from "lucide-react";

export function AddPageButton({ canAddMore }: { canAddMore: boolean }) {
  const t = useI18n("admin");

  return (
    <div className="flex flex-col items-end gap-2">
      {canAddMore ? (
        <Link button href="/dashboard/pages/new" variant="default">
          <Plus /> {t("pages.addNew")}
        </Link>
      ) : (
        <TooltipResponsive>
          <TooltipResponsiveTrigger>
            <span>
              <Button variant="default" disabled>
                <Lock /> {t("pages.addNew")}
              </Button>
            </span>
          </TooltipResponsiveTrigger>
          <TooltipResponsiveContent>
            <PageLimitUpgradeHint />
          </TooltipResponsiveContent>
        </TooltipResponsive>
      )}
    </div>
  );
}
