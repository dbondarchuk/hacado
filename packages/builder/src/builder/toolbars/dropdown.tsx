import { Leaves } from "@hacado/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  ToolbarButton,
  useOpenState,
} from "@hacado/ui";
import { destructAndReplace, resolveProperty } from "@hacado/utils";
import { CSSProperties, ReactNode } from "react";
import { ConfigurationProps } from "../../documents/types";

export type ToolbarDropdownItem = {
  value: string | null;
  label: string;
  style?: CSSProperties;
};

export type ToolbarDropdownItemWithIcon = ToolbarDropdownItem & {
  icon: ReactNode;
};

export type ToolbarDropdownPropsValues<T> = ConfigurationProps<T> & {
  defaultValue: string;
};

export type ToolbarDropdownProps<T> = ToolbarDropdownPropsValues<T> & {
  property: Leaves<T>;
  tooltip: string;
} & (
    | {
        items: ToolbarDropdownItemWithIcon[];
      }
    | {
        items: ToolbarDropdownItem[];
        icon: ReactNode;
      }
  );

export const ToolbarDropdownMenu = <T,>({
  data,
  setData,
  defaultValue,
  items,
  property,
  tooltip,
  ...rest
}: ToolbarDropdownProps<T>) => {
  const openState = useOpenState();
  const propValue = resolveProperty(data, property);

  const Icon =
    "icon" in rest
      ? rest.icon
      : ((items as ToolbarDropdownItemWithIcon[]).find(
          (item) => item.value === propValue,
        )?.icon ??
        (items as ToolbarDropdownItemWithIcon[]).find(
          (item) => item.value === defaultValue,
        )?.icon!);

  return (
    <DropdownMenu modal={false} {...openState}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          pressed={openState.open}
          tooltip={tooltip}
          isDropdown
          className="text-xs"
        >
          {Icon}
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="min-w-0" align="start">
        <DropdownMenuRadioGroup
          value={propValue ?? defaultValue}
          onValueChange={(value: any) => {
            setData(
              destructAndReplace(data, property, value) as unknown as any,
            );
          }}
        >
          {items.map(
            ({
              value: itemValue,
              label: itemLabel,
              style: itemStyle,
              ...rest
            }) => (
              <DropdownMenuRadioItem
                key={itemValue}
                value={itemValue as string}
                className="min-w-[180px]"
                style={itemStyle}
              >
                {"icon" in rest && rest.icon} {itemLabel}
              </DropdownMenuRadioItem>
            ),
          )}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
