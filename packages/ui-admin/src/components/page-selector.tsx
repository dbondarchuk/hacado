"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { PageListModelWithUrl } from "@hacado/types";
import { cn, ComboboxAsync, IComboboxItem, Skeleton } from "@hacado/ui";
import React from "react";

const PageShortLabel: React.FC<{ page: PageListModelWithUrl }> = ({ page }) => {
  return (
    <span className="flex flex-col justify-center gap-0.5 shrink overflow-hidden text-nowrap min-w-0">
      <span className="text-sm truncate">{page.title}</span>
      <span className="text-xs italic truncate">/{page.slug}</span>
    </span>
  );
};

const PageLoader: React.FC = () => {
  return (
    <div className="flex flex-col gap-1">
      <Skeleton className="w-full h-5" />
      <Skeleton className="w-2/3 h-4" />
    </div>
  );
};

export type PageSelectorProps = {
  value?: string;
  disabled?: boolean;
  excludeIds?: string[];
  className?: string;
  placeholder?: string;
  onItemSelect?: (value: string) => void;
  onValueChange?: (value: PageListModelWithUrl | undefined) => void;
  allowClear?: boolean;
};

export const PageSelector: React.FC<PageSelectorProps> = ({
  disabled,
  className,
  excludeIds,
  value,
  onItemSelect,
  onValueChange,
  allowClear,
  placeholder,
}) => {
  const t = useI18n("ui");
  const [itemsCache, setItemsCache] = React.useState<
    Record<string, PageListModelWithUrl>
  >({});

  const getPages = React.useCallback(
    async (page: number, search?: string) => {
      const limit = 10;
      const result = await adminApi.pages.getPages({
        page,
        limit,
        search,
        priorityId: value ? [value] : undefined,
      });

      const filtered = excludeIds?.length
        ? result.items.filter((item) => !excludeIds.includes(item._id))
        : result.items;

      setItemsCache((prev) => ({
        ...prev,
        ...filtered.reduce(
          (map, cur) => ({
            ...map,
            [cur._id]: cur,
          }),
          {} as typeof itemsCache,
        ),
      }));

      return {
        items: filtered.map((item) => ({
          label: <PageShortLabel page={item} />,
          shortLabel: (
            <span className="shrink overflow-hidden text-nowrap min-w-0">
              {item.title}
            </span>
          ),
          value: item._id,
        })) satisfies IComboboxItem[],
        hasMore: page * limit < result.total,
      };
    },
    [value, excludeIds],
  );

  React.useEffect(() => {
    if (!value || itemsCache[value]) return;
    let cancelled = false;
    void (async () => {
      const result = await adminApi.pages.getPages({
        page: 1,
        limit: 1,
        priorityId: [value],
      });
      if (cancelled || !result.items[0]) return;
      const item = result.items[0];
      setItemsCache((prev) => ({
        ...prev,
        [item._id]: item,
      }));
    })();
    return () => {
      cancelled = true;
    };
  }, [value]);

  React.useEffect(() => {
    onValueChange?.(value ? itemsCache[value] : undefined);
  }, [value, itemsCache, onValueChange]);

  return (
    <ComboboxAsync
      // @ts-ignore Allow clear passthrough
      onChange={onItemSelect}
      disabled={disabled}
      className={cn("flex font-normal text-base max-w-full", className)}
      placeholder={placeholder || t("pageSelector.placeholder")}
      value={value}
      allowClear={allowClear}
      fetchItems={getPages}
      loader={<PageLoader />}
    />
  );
};
