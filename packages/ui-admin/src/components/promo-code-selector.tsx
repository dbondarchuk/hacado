import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { Discount } from "@hacado/types";
import {
  cn,
  ComboboxAsync,
  IComboboxItem,
  Skeleton,
  toast,
} from "@hacado/ui";
import { DateTime } from "luxon";
import React from "react";

type PromoCode = Discount & { code: string };

const PromoCodeShortLabel: React.FC<{
  promoCode: PromoCode;
  row?: boolean;
}> = ({ promoCode, row }) => {
  const t = useI18n("ui");
  let active = !!promoCode.enabled;
  if (
    promoCode.startDate &&
    DateTime.fromJSDate(promoCode.startDate) > DateTime.now()
  )
    active = false;
  if (
    promoCode.endDate &&
    DateTime.fromJSDate(promoCode.endDate) < DateTime.now()
  )
    active = false;

  return row ? (
    <div className="flex flex-row gap-2 items-center">
      <span>{promoCode.code}</span>
      <span className="text-sm italic">
        -{promoCode.type === "amount" && "$"}
        {promoCode.value}
        {promoCode.type === "percentage" && "%"}
      </span>
    </div>
  ) : (
    <div className="flex flex-col  gap-1 shrink overflow-hidden text-nowrap min-w-0 max-w-[var(--radix-popover-trigger-width)]">
      <span>{promoCode.code}</span>
      {!active && (
        <span className="font-bold uppercase">
          {t("promoCodeSelector.notActive")}
        </span>
      )}
      <span className="text-xs italic">{promoCode.name}</span>
      <span className="text-sm italic">
        -{promoCode.type === "amount" && "$"}
        {promoCode.value}
        {promoCode.type === "percentage" && "%"}
      </span>
    </div>
  );
};

const PromoCodeLoader: React.FC<{}> = ({}) => {
  return (
    <div className="flex flex-col items-center gap-1 overflow-hidden text-nowrap pl-6 w-full">
      <Skeleton className="min-w-40 max-w-96 w-full h-5" />
      <Skeleton className="min-w-36 max-w-80 w-full h-4" />
      <Skeleton className="min-w-36 max-w-80 w-full h-4" />
    </div>
  );
};

type BasePromoCodeSelectorProps = {
  value?: string;
  disabled?: boolean;
  className?: string;
  onValueChange?: (promoCode?: PromoCode) => void;
};

type ClearablePromoCodeSelectorProps = BasePromoCodeSelectorProps & {
  onItemSelect: (value: string | undefined) => void;
  allowClear: true;
};

type NonClearablePromoCodeSelectorProps = BasePromoCodeSelectorProps & {
  onItemSelect: (value: string) => void;
  allowClear?: false;
};

export type PromoCodeSelectorProps =
  | NonClearablePromoCodeSelectorProps
  | ClearablePromoCodeSelectorProps;

export const PromoCodeSelector: React.FC<PromoCodeSelectorProps> = ({
  disabled,
  className,
  value,
  onItemSelect,
  onValueChange,
  allowClear,
}) => {
  const t = useI18n("ui");
  const [itemsCache, setItemsCache] = React.useState<Record<string, PromoCode>>(
    {},
  );

  const getDiscounts = React.useCallback(
    async (page: number, search?: string) => {
      const limit = 10;

      try {
        const result = await adminApi.discounts.getDiscounts({
          page,
          limit,
          priorityId: value ? [value] : undefined,
          search,
        });

        const codes: PromoCode[] = result.items.flatMap((discount) =>
          discount.codes.map((code) => ({
            ...discount,
            code,
          })),
        );

        setItemsCache((prev) => ({
          ...prev,
          ...codes.reduce(
            (map, cur) => ({
              ...map,
              [cur.code]: cur,
            }),
            {} as typeof itemsCache,
          ),
        }));

        return {
          items: codes.map((promoCode) => ({
            label: <PromoCodeShortLabel promoCode={promoCode} />,
            shortLabel: <PromoCodeShortLabel promoCode={promoCode} row />,
            value: promoCode.code,
          })) satisfies IComboboxItem[],
          hasMore: page * limit < result.total,
        };
      } catch (error) {
        toast.error(t("promoCodeSelector.requestFailed"));
        console.error(error);
        return {
          items: [],
          hasMore: false,
        };
      }
    },
    [value, setItemsCache, t],
  );

  React.useEffect(() => {
    onValueChange?.(value ? itemsCache[value] : undefined);
  }, [value, itemsCache]);

  return (
    <ComboboxAsync
      // @ts-ignore Allow clear passthrough
      onChange={onItemSelect}
      disabled={disabled}
      className={cn("flex font-normal text-base max-w-full", className)}
      placeholder={t("promoCodeSelector.placeholder")}
      value={value}
      allowClear={allowClear}
      fetchItems={getDiscounts}
      loader={<PromoCodeLoader />}
    />
  );
};
