"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { CustomerPackage } from "@hacado/types";
import { cn, ComboboxAsync, IComboboxItem, Skeleton } from "@hacado/ui";
import { Package } from "lucide-react";
import React from "react";

const CustomerPackageLabel: React.FC<{
  pkg: CustomerPackage;
  compact?: boolean;
}> = ({ pkg, compact }) => {
  const t = useI18n("ui");
  return (
    <span
      className={cn(
        "flex shrink overflow-hidden text-nowrap min-w-0",
        compact ? "items-center gap-2" : "flex-col justify-center gap-1",
      )}
    >
      <span className="flex items-center gap-2">
        <Package size={16} className="shrink-0" />
        <span className="truncate">{pkg.name}</span>
      </span>
      {!compact ? (
        <span className="text-xs italic text-muted-foreground">
          {t("customerPackageSelector.remaining", {
            remaining: pkg.remainingCredits,
            total: pkg.totalCredits,
          })}
        </span>
      ) : null}
    </span>
  );
};

const toItem = (pkg: CustomerPackage): IComboboxItem => ({
  label: <CustomerPackageLabel pkg={pkg} />,
  shortLabel: <CustomerPackageLabel pkg={pkg} compact />,
  value: pkg._id,
});

export type CustomerPackageSelectorProps = {
  value?: string;
  customerId?: string;
  optionId?: string;
  memberId?: string;
  dateTime?: Date;
  disabled?: boolean;
  className?: string;
  allowClear?: boolean;
  onItemSelect?: (value: string | undefined) => void;
  onValueChange?: (value: CustomerPackage | undefined) => void;
};

export const CustomerPackageSelector: React.FC<
  CustomerPackageSelectorProps
> = ({
  value,
  customerId,
  optionId,
  memberId,
  dateTime,
  disabled,
  className,
  allowClear,
  onItemSelect,
  onValueChange,
}) => {
  const t = useI18n("ui");
  const [itemsCache, setItemsCache] = React.useState<
    Record<string, CustomerPackage>
  >({});

  const canFetch = !!customerId && !!optionId && !!memberId;
  const fetchKey = `${customerId ?? ""}:${optionId ?? ""}:${memberId ?? ""}:${dateTime?.toISOString() ?? ""}`;

  const getPackages = React.useCallback(
    async (_page: number, _search?: string) => {
      if (!customerId || !optionId || !memberId) {
        return { items: [] as IComboboxItem[], hasMore: false };
      }

      const result = await adminApi.packages.getEligibleCustomerPackages({
        customerId,
        optionId,
        memberId,
        dateTime,
      });

      let packages = result.items;
      if (value && !packages.some((pkg) => pkg._id === value)) {
        const listed = await adminApi.packages.getCustomerPackages({
          customerId,
          page: 1,
          limit: 50,
        });
        const match = listed.items.find((pkg) => pkg._id === value);
        if (match) {
          packages = [match, ...packages];
        }
      }

      setItemsCache((prev) => ({
        ...prev,
        ...packages.reduce(
          (map, cur) => ({ ...map, [cur._id]: cur }),
          {} as typeof itemsCache,
        ),
      }));

      return {
        items: packages.map(toItem),
        hasMore: false,
      };
    },
    [customerId, optionId, memberId, dateTime, value],
  );

  React.useEffect(() => {
    onValueChange?.(value ? itemsCache[value] : undefined);
  }, [value, itemsCache, onValueChange]);

  return (
    <ComboboxAsync
      key={fetchKey}
      // @ts-ignore Allow clear passthrough
      onChange={onItemSelect}
      disabled={disabled || !canFetch}
      className={cn("flex font-normal text-base max-w-full", className)}
      placeholder={
        canFetch
          ? t("customerPackageSelector.placeholder")
          : t("customerPackageSelector.needCustomerAndService")
      }
      value={value}
      allowClear={allowClear}
      fetchItems={getPackages}
      loader={<Skeleton className="w-full h-10" />}
    />
  );
};
