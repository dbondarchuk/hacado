import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { AppointmentOption } from "@hacado/types";
import {
  cn,
  ComboboxAsync,
  IComboboxItem,
  Skeleton,
  useCurrencyFormat,
} from "@hacado/ui";
import { durationToTime } from "@hacado/utils";
import { Clock, DollarSign } from "lucide-react";
import React from "react";

const OptionLabel: React.FC<{ option: AppointmentOption }> = ({ option }) => {
  const t = useI18n("admin");
  const currencyFormat = useCurrencyFormat();
  const time =
    option.durationType === "fixed" ? durationToTime(option.duration) : null;
  return (
    <span className="flex flex-col justify-center gap-2 shrink overflow-hidden text-nowrap min-w-0">
      {option.name}{" "}
      {time && (
        <div className="inline-flex gap-2 items-center text-xs italic">
          <Clock size={16} />
          {t("settings.appointments.form.cards.optionSelector.time", time)}
        </div>
      )}
      {option.durationType === "fixed" && option.price && (
        <div className="inline-flex gap-2 items-center text-xs italic">
          <DollarSign size={16} /> {currencyFormat(option.price)}
        </div>
      )}
      {option.durationType === "flexible" && option.pricePerHour && (
        <div className="inline-flex gap-2 items-center text-xs italic">
          <DollarSign size={16} />{" "}
          {t("common.pricePerHour", {
            price: currencyFormat(option.pricePerHour),
          })}
        </div>
      )}
    </span>
  );
};

const OptionLoader: React.FC = () => {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="w-full h-5" />
      <Skeleton className="w-full h-4" />
      <Skeleton className="w-full h-4" />
    </div>
  );
};

export type OptionSelectorProps = {
  value?: string;
  disabled?: boolean;
  excludeIds?: string[];
  className?: string;
  onItemSelect?: (value: string) => void;
  onValueChange?: (value: AppointmentOption | undefined) => void;
  allowClear?: boolean;
};

export const OptionSelector: React.FC<OptionSelectorProps> = ({
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
    Record<string, AppointmentOption>
  >({});

  const getOptions = React.useCallback(
    async (page: number, search?: string) => {
      const limit = 10;
      const result = await adminApi.serviceOptions.getServiceOptions({
        page,
        limit,
        search,
        priorityId: value ? [value] : undefined,
      });

      setItemsCache((prev) => ({
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
        items: result.items
          .filter((option) => !excludeIds?.find((id) => id === option._id))
          .map((option) => ({
            label: <OptionLabel option={option} />,
            shortLabel: (
              <span className="shrink overflow-hidden text-nowrap min-w-0">
                {option.name}
              </span>
            ),
            value: option._id,
          })) satisfies IComboboxItem[],
        hasMore: page * limit < result.total,
      };
    },
    [value, setItemsCache, t, excludeIds],
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
      placeholder={t("optionSelector.placeholder")}
      value={value}
      allowClear={allowClear}
      fetchItems={getOptions}
      loader={<OptionLoader />}
    />
  );
};
