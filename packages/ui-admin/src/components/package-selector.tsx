"use client";
import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { AppointmentPackage } from "@hacado/types";
import {
  cn,
  ComboboxAsync,
  IComboboxItem,
  Skeleton,
  useCurrencyFormat,
} from "@hacado/ui";
import { Package } from "lucide-react";
import React from "react";

const PackageLabel: React.FC<{ pkg: AppointmentPackage }> = ({ pkg }) => {
  const currencyFormat = useCurrencyFormat();
  return (
    <span className="flex flex-col justify-center gap-1 shrink overflow-hidden text-nowrap min-w-0">
      <span className="flex items-center gap-2">
        <Package size={16} />
        {pkg.name}
      </span>
      <span className="text-xs italic">{currencyFormat(pkg.price)}</span>
    </span>
  );
};

export type PackageSelectorProps = {
  value?: string;
  disabled?: boolean;
  excludeIds?: string[];
  className?: string;
  onItemSelect?: (value: string) => void;
  onValueChange?: (value: AppointmentPackage | undefined) => void;
  allowClear?: boolean;
};

export const PackageSelector: React.FC<PackageSelectorProps> = ({
  disabled,
  className,
  excludeIds,
  value,
  onItemSelect,
  onValueChange,
  allowClear,
}) => {
  const t = useI18n("ui");
  const [itemsCache, setItemsCache] = React.useState<
    Record<string, AppointmentPackage>
  >({});

  const getPackages = React.useCallback(
    async (page: number, search?: string) => {
      const limit = 10;
      const result = await adminApi.packages.getPackages({
        page,
        limit,
        search,
        status: ["active"],
        priorityId: value ? [value] : undefined,
      });

      setItemsCache((prev) => ({
        ...prev,
        ...result.items.reduce(
          (map, cur) => ({ ...map, [cur._id]: cur }),
          {} as typeof itemsCache,
        ),
      }));

      return {
        items: result.items
          .filter((pkg) => !excludeIds?.find((id) => id === pkg._id))
          .map((pkg) => ({
            label: <PackageLabel pkg={pkg} />,
            shortLabel: (
              <span className="shrink overflow-hidden text-nowrap min-w-0">
                {pkg.name}
              </span>
            ),
            value: pkg._id,
          })) satisfies IComboboxItem[],
        hasMore: page * limit < result.total,
      };
    },
    [value, excludeIds],
  );

  React.useEffect(() => {
    onValueChange?.(value ? itemsCache[value] : undefined);
  }, [value, itemsCache, onValueChange]);

  return (
    <ComboboxAsync
      // @ts-ignore Allow clear passthrough
      onChange={onItemSelect}
      disabled={disabled}
      className={cn("flex font-normal text-base max-w-full", className)}
      placeholder={t("packageSelector.placeholder")}
      value={value}
      allowClear={allowClear}
      fetchItems={getPackages}
      loader={<Skeleton className="w-full h-10" />}
    />
  );
};
