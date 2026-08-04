"use client";

import { ResetButton, type ColorInput } from "@timelish/builder";
import { BuilderKeys, useI18n } from "@timelish/i18n/client";
import { DistributiveOmit } from "@timelish/types";
import {
  Button,
  Combobox,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@timelish/ui";
import { Sketch } from "@uiw/react-color";
import { Plus } from "lucide-react";
import React from "react";
import { COLORS_LIST } from "../../style/helpers/colors";

type Props = DistributiveOmit<React.ComponentProps<typeof ColorInput>, "label">;

export const ColorExtendedInput: React.FC<Props> = ({
  defaultValue,
  onChange,
  nullable,
}) => {
  const [value, setValue] = React.useState(defaultValue);
  const t = useI18n("builder");
  const getSelectValue = (value?: string | null) =>
    !value && nullable
      ? "default"
      : value?.startsWith("var") ||
          value === "transparent" ||
          value === "currentColor"
        ? value
        : "custom";

  const [selectValue, setSelectValue] = React.useState(getSelectValue(value));
  const isCustom = selectValue === "custom";

  React.useEffect(() => {
    if (value !== defaultValue) {
      setValue(defaultValue);
      setSelectValue(getSelectValue(defaultValue));
    }
  }, [defaultValue, setValue]);

  const onSelectValueChange = React.useCallback(
    (val: string) => {
      setSelectValue(val);

      const newValue =
        val === "default" ? null : val === "custom" ? "0 0% 100%" : val;

      setValue(newValue);
      onChange(newValue as any as string);
    },
    [onChange],
  );

  const renderOpenButton = () => {
    if (value) {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="border border-secondary w-8"
          style={{ background: `hsl(${value})` }}
        />
      );
    }
    return (
      <Button
        variant="ghost"
        size="sm"
        className="bg-background border border-secondary w-8"
      >
        <Plus size={16} />
      </Button>
    );
  };

  return (
    <div className="flex w-full">
      <Popover>
        <div className="flex flex-row gap-1 w-full">
          <Combobox
            value={selectValue}
            onItemSelect={onSelectValueChange}
            className="w-full flex-grow"
            size="sm"
            searchLabel={t("pageBuilder.styles.colors.custom")}
            values={[
              ...(nullable
                ? [
                    {
                      value: "default",
                      label: t("pageBuilder.styles.colors.default"),
                    },
                  ]
                : []),
              ...COLORS_LIST.map((c) => ({
                value: c.value,
                label: t(`pageBuilder.styles.colors.${c.key}` as BuilderKeys),
              })),
              {
                value: "custom",
                label: t("pageBuilder.styles.colors.custom"),
              },
            ]}
          />
          {isCustom && (
            <PopoverTrigger asChild>{renderOpenButton()}</PopoverTrigger>
          )}
          {nullable && (
            <ResetButton
              onClick={() => {
                setValue(null);
                onChange(null);
              }}
            />
          )}
        </div>
        <PopoverContent className="bg-transparent border-none shadow-none w-fit">
          <Sketch
            color={value || undefined}
            disableAlpha
            onChange={(c) => {
              const color = `${c.hsl.h.toFixed(0)} ${c.hsl.s.toFixed(1)}% ${c.hsl.l.toFixed(1)}%`;
              setValue(color);
              onChange(color);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
