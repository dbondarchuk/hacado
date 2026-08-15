import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { PageFooterListModel } from "@hacado/types";
import { cn, ComboboxAsync, IComboboxItem, Skeleton } from "@hacado/ui";
import React from "react";

const FooterShortLabel: React.FC<{
  footer: PageFooterListModel;
  row?: boolean;
}> = ({ footer, row }) => {
  const t = useI18n("admin");
  return (
    <div
      className={cn(
        "flex gap-0.5  shrink overflow-hidden text-nowrap min-w-0 max-w-[var(--radix-popover-trigger-width)]",
        row ? "items-baseline" : "flex-col",
      )}
    >
      <span>{footer.name}</span>
      {!row && (
        <span className="text-sm italic">
          {t("pages.footers.usedOnPages", {
            count: footer.usedCount ?? 0,
          })}
        </span>
      )}
    </div>
  );
};

const FooterLoader: React.FC<{}> = ({}) => {
  return (
    <div className="flex flex-col gap-0.5 overflow-hidden text-nowrap pl-6 w-full">
      <Skeleton className="min-w-36 max-w-80 w-full h-5" />
      <Skeleton className="min-w-36 max-w-80 w-full h-4" />
    </div>
  );
};

type BaseFooterSelectorProps = {
  value?: string;
  disabled?: boolean;
  className?: string;
  onValueChange?: (footer?: PageFooterListModel) => void;
};

type ClearableFooterSelectorProps = BaseFooterSelectorProps & {
  onItemSelect: (value: string | undefined) => void;
  allowClear: true;
};

type NonClearableFooterSelectorProps = BaseFooterSelectorProps & {
  onItemSelect: (value: string) => void;
  allowClear?: false;
};

export type FooterSelectorProps =
  | NonClearableFooterSelectorProps
  | ClearableFooterSelectorProps;

export const FooterSelector: React.FC<FooterSelectorProps> = ({
  disabled,
  className,
  value,
  onItemSelect,
  onValueChange,
  allowClear,
}) => {
  const t = useI18n("admin");
  const [itemsCache, setItemsCache] = React.useState<
    Record<string, PageFooterListModel>
  >({});

  const getFooters = React.useCallback(
    async (page: number, search?: string) => {
      const limit = 10;
      const res = await adminApi.pageFooters.getPageFooters({
        page,
        limit,
        search,
        priorityId: value ? [value] : undefined,
      });

      setItemsCache((prev) => ({
        ...prev,
        ...res.items.reduce(
          (map, cur) => ({
            ...map,
            [cur._id]: cur,
          }),
          {} as typeof itemsCache,
        ),
      }));

      return {
        items: res.items.map((footer) => ({
          label: <FooterShortLabel footer={footer} />,
          shortLabel: <FooterShortLabel footer={footer} row />,
          value: footer._id ?? "",
        })) satisfies IComboboxItem[],
        hasMore: page * limit < res.total,
      };
    },
    [value, setItemsCache],
  );

  React.useEffect(() => {
    onValueChange?.(value ? itemsCache[value] : undefined);
  }, [value, itemsCache, onValueChange]);

  return (
    <ComboboxAsync
      // @ts-ignore Allow clear passthrough
      onChange={onItemSelect}
      disabled={disabled}
      className={cn("flex font-normal text-lg max-w-full", className)}
      placeholder={t("pages.form.footer")}
      value={value}
      allowClear={allowClear}
      fetchItems={getFooters}
      loader={<FooterLoader />}
    />
  );
};
