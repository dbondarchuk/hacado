import { addonsApi } from "@hacado/api-sdk/admin/addons";
import { useI18n } from "@hacado/i18n/client";
import { AppointmentAddon } from "@hacado/types/booking";
import { AddonsType } from "@hacado/types/services";
import { cn } from "@hacado/ui/cn";
import { Combobox, IComboboxItem } from "@hacado/ui/combobox";
import { MultiSelect, OptionType } from "@hacado/ui/multi-select";
import { durationToTime } from "@hacado/utils/time";
import { Clock, DollarSign } from "lucide-react";
import React from "react";

const AddonLabel: React.FC<{ addon: AppointmentAddon }> = ({ addon }) => {
  const time = addon.duration ? durationToTime(addon.duration) : null;
  return (
    <span className="flex flex-col justify-center gap-2 shrink overflow-hidden text-nowrap min-w-0">
      {addon.name}{" "}
      {time && (
        <div className="inline-flex gap-2 items-center text-xs italic">
          <Clock size={16} /> {`${time.hours}hr ${time.minutes}min`}
        </div>
      )}
      {addon.price && (
        <div className="inline-flex gap-2 items-center text-xs italic">
          <DollarSign size={16} /> ${addon.price}
        </div>
      )}
    </span>
  );
};

const getAddons = async (forOptionId?: string) => {
  const includeUsage = forOptionId ? true : false;
  const response = await addonsApi.getAddons({
    limit: 10000,
    includeUsage,
  });

  if (!forOptionId) {
    return response.items;
  }

  return response.items.filter((addon) =>
    (addon as AddonsType<true>).options?.some(
      (option) => option._id === forOptionId,
    ),
  );
};

const checkAddonSearch = (addon: AppointmentAddon, query: string) => {
  const search = query.toLocaleLowerCase();
  return addon.name.toLocaleLowerCase().includes(search);
};

export type AddonSelectorProps = {
  disabled?: boolean;
  excludeIds?: string[];
  className?: string;
  forOptionId?: string;
} & (
  | {
      onItemSelect?: (value: string) => void;
      onValueChange?: (value: AppointmentAddon | undefined) => void;
      value?: string;
      multi?: false;
    }
  | {
      multi: true;
      onItemSelect?: (value: string[]) => void;
      onValueChange?: (value: AppointmentAddon[] | undefined) => void;
      value?: string[];
    }
);

export const AddonSelector = React.forwardRef<
  HTMLButtonElement,
  AddonSelectorProps
>(
  (
    {
      disabled,
      className,
      excludeIds,
      value,
      onItemSelect,
      onValueChange,
      multi,
      forOptionId,
      ...rest
    },
    ref,
  ) => {
    const t = useI18n("admin");
    const [addons, setAddons] = React.useState<AppointmentAddon[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
      const fn = async () => {
        try {
          setIsLoading(true);
          const addons = await getAddons(forOptionId);
          setAddons(addons);

          if (forOptionId && value) {
            if (typeof value === "string") {
              if (!addons.find((addon) => addon._id === value)) {
                onItemSelect?.(undefined as any);
              }
            } else {
              onItemSelect?.(
                value.filter((id) =>
                  addons.some((addon) => addon._id === id),
                ) as any,
              );
            }
          }
        } finally {
          setIsLoading(false);
        }
      };

      fn();
    }, [forOptionId]);

    const addonValues = (addons: AppointmentAddon[]): IComboboxItem[] =>
      addons
        .filter(({ _id }) => !excludeIds?.find((id) => id === _id))
        .map((field) => {
          return {
            value: field._id,
            shortLabel: (
              <span className="shrink overflow-hidden text-nowrap min-w-0">
                {field.name}
              </span>
            ),
            label: <AddonLabel addon={field} />,
          };
        });

    const addonMultiOptions = (addons: AppointmentAddon[]): OptionType[] =>
      addons
        .filter(({ _id }) => !excludeIds?.find((id) => id === _id))
        .map((addon) => {
          return {
            value: addon._id,
            label: addon.name,
          };
        });

    React.useEffect(() => {
      const selectedAddons = value
        ? addons.filter((addon) => value.includes(addon._id))
        : [];

      onValueChange?.((multi ? selectedAddons : selectedAddons[0]) as any);
    }, [value, addons, onValueChange, multi]);

    return multi ? (
      <MultiSelect
        {...rest}
        ref={ref}
        disabled={disabled || isLoading}
        className={cn("flex font-normal text-base", className)}
        options={addonMultiOptions(addons)}
        placeholder={
          isLoading
            ? t("services.addonSelector.loading")
            : t("services.addonSelector.selectAddon")
        }
        selected={value || []}
        onChange={onItemSelect}
      />
    ) : (
      <Combobox
        {...rest}
        ref={ref}
        disabled={disabled || isLoading}
        className={cn("flex font-normal text-base", className)}
        values={addonValues(addons)}
        searchLabel={
          isLoading
            ? t("services.addonSelector.loading")
            : t("services.addonSelector.selectAddon")
        }
        value={value}
        customSearch={(search) =>
          addonValues(addons.filter((app) => checkAddonSearch(app, search)))
        }
        onItemSelect={onItemSelect}
      />
    );
  },
);

AddonSelector.displayName = "AddonSelector";
