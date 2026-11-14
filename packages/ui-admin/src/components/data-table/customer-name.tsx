"use client";
import { useI18n } from "@hacado/i18n/client";
import {
  TooltipResponsive,
  TooltipResponsiveContent,
  TooltipResponsiveTrigger,
} from "@hacado/ui/tooltip-responsive";
import { Lock } from "lucide-react";

export const CustomerName = ({
  customer,
}: {
  customer: { name: string; isDeleted?: boolean; deletedAt?: Date };
}) => {
  const t = useI18n("admin");
  return (
    <span className="whitespace-nowrap">
      {customer.isDeleted && (
        <TooltipResponsive>
          <TooltipResponsiveTrigger>
            <Lock className="mr-1.5 inline-block size-4 align-text-bottom text-xs text-gray-500" />
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
