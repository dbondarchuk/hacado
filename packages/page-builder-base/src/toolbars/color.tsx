import { ConfigurationProps } from "@hacado/builder";
import { Leaves } from "@hacado/types";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ToolbarButton,
  useOpenState,
} from "@hacado/ui";
import { destructAndReplace, resolveProperty } from "@hacado/utils";
import { Sketch } from "@uiw/react-color";
import { X } from "lucide-react";
import React, { ReactNode } from "react";
import { COLORS_LIST } from "../style/helpers/colors";

export type ToolbarColorPropsValues<T> = ConfigurationProps<T> &
  (
    | {
        defaultValue: string;
        nullable?: false;
      }
    | {
        defaultValue?: string | null;
        nullable: true;
      }
  );

export type ToolbarColorProps<T> = ToolbarColorPropsValues<T> & {
  property: Leaves<T>;
  tooltip: string;
  icon: ReactNode;
};

export const ToolbarColorMenu = <T,>({
  data,
  setData,
  defaultValue,
  icon,
  property,
  tooltip,
  nullable,
}: ToolbarColorProps<T>) => {
  const openState = useOpenState();
  const propValue = resolveProperty(data, property);

  const onChange = (color: string | null | undefined) => {
    setData(destructAndReplace(data, property, color) as unknown as any);
  };

  const [value, setValue] = React.useState(defaultValue);

  const getSelectValue = (value?: string | null) =>
    !value && nullable
      ? "default"
      : value?.startsWith("var")
        ? value
        : "custom";

  const [selectValue, setSelectValue] = React.useState(getSelectValue(value));
  const isCustom = selectValue === "custom";

  React.useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue, setValue]);

  React.useEffect(() => {
    setSelectValue(getSelectValue(value));
  }, [value]);

  React.useEffect(() => {
    const newValue =
      selectValue === "default"
        ? null
        : selectValue === "custom"
          ? "0 0% 100%"
          : selectValue;
    setValue(newValue);
    onChange(newValue);
  }, [selectValue]);

  return (
    <DropdownMenu modal={false} {...openState}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={openState.open} tooltip={tooltip} isDropdown>
          {icon}
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="flex flex-col gap-2" align="start">
        <Button
          variant="ghost"
          className="self-end size-6 [&>svg]:size-4 p-0"
          aria-label="Close"
          onClick={() => {
            openState.onOpenChange(false);
          }}
        >
          <X />
        </Button>
        <Select value={selectValue} onValueChange={setSelectValue}>
          <SelectTrigger className="w-full flex-grow">
            <SelectValue placeholder="Select color" />
          </SelectTrigger>
          <SelectContent>
            {nullable && <SelectItem value="default">Default</SelectItem>}
            {COLORS_LIST.map((c) => (
              <SelectItem value={c.value} key={c.key}>
                {c.label}
              </SelectItem>
            ))}
            <SelectItem value="custom">Custom color</SelectItem>
          </SelectContent>
        </Select>
        {isCustom && (
          <Sketch
            className="!shadow-none"
            color={propValue ?? defaultValue}
            onChange={(c) => {
              const color = `${c.hsl.h.toFixed(0)} ${c.hsl.s.toFixed(1)}% ${c.hsl.l.toFixed(1)}%`;

              onChange(color);
            }}
            disableAlpha
          />
        )}
        {nullable && (
          <Button
            variant="ghost"
            onClick={() => {
              setData(
                destructAndReplace(data, property, null) as unknown as any,
              );
            }}
          >
            <X size={16} /> Clear
          </Button>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
