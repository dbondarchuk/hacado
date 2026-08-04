"use client";
import { adminApi } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import { GiftCardListModel } from "@timelish/types";
import {
  cn,
  ComboboxAsync,
  IComboboxItem,
  Skeleton,
  useCurrencyFormat,
} from "@timelish/ui";
import { Gift } from "lucide-react";
import { DateTime } from "luxon";
import React from "react";

const GiftCardShortLabel: React.FC<{
  giftCard: GiftCardListModel;
  row?: boolean;
}> = ({ giftCard, row }) => {
  const t = useI18n("admin");
  const currencyFormat = useCurrencyFormat();
  return (
    <div className="flex flex-row items-center gap-2 shrink overflow-hidden text-nowrap min-w-0 max-w-[var(--radix-popover-trigger-width)]">
      <Gift size={20} />
      <div className={cn("flex gap-0.5", row ? "items-baseline" : "flex-col")}>
        <div>{giftCard.code}</div>
        <div className="text-xs italic">
          {t("giftCardSelector.amountLabel", {
            amount: currencyFormat(giftCard.amount),
            amountLeft: currencyFormat(giftCard.amountLeft),
          })}
        </div>
        {giftCard.expiresAt && !row && (
          <div className="text-xs italic">
            {t("giftCardSelector.expiresAt", {
              expiresAt: DateTime.fromJSDate(giftCard.expiresAt).toLocaleString(
                DateTime.DATETIME_MED,
              ),
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const GiftCardLoader: React.FC<{}> = ({}) => {
  return (
    <div className="flex flex-row items-center gap-2 overflow-hidden text-nowrap pl-6 w-full">
      <Skeleton className="w-5 h-5 rounded-full" />
      <div className="flex gap-0.5 flex-col w-full">
        <Skeleton className="min-w-40 max-w-96 w-full h-5" />
        <Skeleton className="min-w-36 max-w-80 w-full h-4" />
        <Skeleton className="min-w-36 max-w-80 w-full h-4" />
      </div>
    </div>
  );
};

type BaseGiftCardSelectorProps = {
  value?: string;
  disabled?: boolean;
  className?: string;
  onValueChange?: (giftCard?: GiftCardListModel) => void;
};

type ClearableGiftCardSelectorProps = BaseGiftCardSelectorProps & {
  onItemSelect: (value: string | undefined) => void;
  allowClear: true;
};

type NonClearableGiftCardSelectorProps = BaseGiftCardSelectorProps & {
  onItemSelect: (value: string) => void;
  allowClear?: false;
};

export type GiftCardSelectorProps =
  | NonClearableGiftCardSelectorProps
  | ClearableGiftCardSelectorProps;

export const GiftCardSelector: React.FC<GiftCardSelectorProps> = ({
  disabled,
  className,
  value,
  onItemSelect,
  onValueChange,
  allowClear,
}) => {
  const t = useI18n("admin");
  const [itemsCache, setItemsCache] = React.useState<
    Record<string, GiftCardListModel>
  >({});

  const getGiftCards = React.useCallback(
    async (page: number, search?: string) => {
      const limit = 10;
      const result = await adminApi.giftCards.getGiftCards({
        page,
        limit,
        search,
        status: ["active"],
        priorityId: value ? [value] : undefined,
      });

      setItemsCache((prev: Record<string, GiftCardListModel>) => ({
        ...prev,
        ...result.items.reduce(
          (map, cur) => ({
            ...map,
            [cur._id]: cur,
          }),
          {} as typeof itemsCache,
        ),
      }));

      return {
        items: result.items.map((giftCard) => ({
          label: <GiftCardShortLabel giftCard={giftCard} />,
          shortLabel: <GiftCardShortLabel giftCard={giftCard} row />,
          value: giftCard._id,
        })) satisfies IComboboxItem[],
        hasMore: page * limit < result.total,
      };
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
      className={cn("flex font-normal text-base max-w-full min-w-0", className)}
      placeholder={t("giftCardSelector.placeholder")}
      value={value}
      allowClear={allowClear}
      fetchItems={getGiftCards}
      loader={<GiftCardLoader />}
    />
  );
};
