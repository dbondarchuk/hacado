import { useI18n } from "@hacado/i18n/client";
import {
  Combobox,
  IComboboxItem,
  Icon,
  iconNames,
  type IconName,
} from "@hacado/ui";
import { capitalize } from "@hacado/utils";
import { ControllerRenderProps } from "react-hook-form";

export type IconSelectProps = {
  field: ControllerRenderProps;
  disabled?: boolean;
  allowClear?: boolean;
};

function transformIconName(iconName: IconName): string {
  return iconName
    .split("-")
    .map((word) => capitalize(word))
    .join(" ");
}

const iconValues = iconNames.map(
  (icon) =>
    ({
      value: icon,
      label: (
        <div className="flex flex-row gap-1 items-center">
          <Icon name={icon as IconName} size={20} /> {transformIconName(icon)}
        </div>
      ),
    }) as IComboboxItem,
);

export const IconSelect: React.FC<IconSelectProps> = ({
  field,
  disabled,
  allowClear,
}) => {
  const t = useI18n("admin");

  return (
    <Combobox
      className="flex w-full font-normal text-lg"
      values={iconValues}
      searchLabel={t("menuItem.iconSelect.selectIcon")}
      disabled={disabled}
      customSearch={(search) =>
        iconValues.filter(
          (icon) =>
            icon.value
              .toLocaleLowerCase()
              .indexOf(search.toLocaleLowerCase()) >= 0 ||
            transformIconName(icon.value as IconName)
              .toLowerCase()
              .indexOf(search.toLowerCase()) >= 0,
        )
      }
      value={field.value}
      onItemSelect={(value: string | undefined) => field.onChange(value)}
      allowClear={allowClear}
    />
  );
};
