"use client";
import { useI18n } from "@hacado/i18n/client";
import {
  TooltipResponsive,
  TooltipResponsiveContent,
  TooltipResponsiveTrigger,
} from "@hacado/ui";
import { Lock } from "lucide-react";

export const CustomerName = ({
  customer,
}: {
  customer: { name: string; isDeleted?: boolean; deletedAt?: Date };
}) => {
  const t = useI18n("admin");
  return (
    <span className="flex flex-row items-center gap-2">
      {customer.isDeleted && (
        <TooltipResponsive>
          <TooltipResponsiveTrigger>
            <Lock className="text-xs text-gray-500 size-4" />
          </TooltipResponsiveTrigger>
          <TooltipResponsiveContent>
            <span>{t("customers.deletedCustomer")}</span>
          </TooltipResponsiveContent>
        </TooltipResponsive>
      )}
      {customer.name}
    </span>
  );
};
