"use client";

import { AllKeys, BaseAllKeys, useI18n } from "@timelish/i18n/client";
import { Button, cn, Combobox } from "@timelish/ui";
import { X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  NumberValueWithUnit,
  NumberValueWithUnitOrGlobalKeyword,
  NumberValueWithUnitOrKeyword,
} from "../../style/zod";
import {
  RawNumberInputWithUnit,
  RawNumberInputWithUnitsProps,
} from "./raw-number-input-with-units";
import { CSSValueOption } from "./types";

// Create options list
const globalKeywords = [
  {
    value: "auto",
    label: "builder.pageBuilder.styles.keywords.auto" satisfies BaseAllKeys,
    isKeyword: false,
  },
  {
    value: "inherit",
    label: "builder.pageBuilder.styles.keywords.inherit" satisfies BaseAllKeys,
    isKeyword: false,
  },
  {
    value: "initial",
    label: "builder.pageBuilder.styles.keywords.initial" satisfies BaseAllKeys,
    isKeyword: false,
  },
  {
    value: "unset",
    label: "builder.pageBuilder.styles.keywords.unset" satisfies BaseAllKeys,
    isKeyword: false,
  },
] as const satisfies CSSValueOption<string>[];
type BaseRawNumberInputWithUnitsAndKeywordsProps = Pick<
  RawNumberInputWithUnitsProps,
  | "icon"
  | "min"
  | "max"
  | "step"
  | "forceUnit"
  | "id"
  | "options"
  | "nullable"
  | "noMax"
  | "noMin"
  | "allowNegative"
> & {
  className?: string;
  notAllowedGlobalKeywords?: (typeof globalKeywords)[number]["value"][];
};

// Type for when keywords are provided
interface RawNumberInputWithUnitsAndKeywordsPropsWithKeywords<T extends string>
  extends BaseRawNumberInputWithUnitsAndKeywordsProps {
  value: NumberValueWithUnitOrKeyword<T> | null | undefined;
  onChange: (value: NumberValueWithUnitOrKeyword<T>) => void;
  keywords: readonly CSSValueOption<T>[];
}

// Type for when keywords are not provided
interface RawNumberInputWithUnitsAndKeywordsPropsWithoutKeywords
  extends BaseRawNumberInputWithUnitsAndKeywordsProps {
  value: NumberValueWithUnitOrGlobalKeyword | null | undefined;
  onChange: (value: NumberValueWithUnitOrGlobalKeyword) => void;
  keywords?: never;
}

type RawNumberInputWithUnitsAndKeywordsProps<T extends string> =
  | RawNumberInputWithUnitsAndKeywordsPropsWithKeywords<T>
  | RawNumberInputWithUnitsAndKeywordsPropsWithoutKeywords;

const customKeyword = {
  value: "custom",
  label: "builder.pageBuilder.styles.keywords.custom" satisfies BaseAllKeys,
  isKeyword: false,
};

const nullKeyword = {
  value: "null",
  label: "builder.pageBuilder.styles.keywords.notSet" satisfies BaseAllKeys,
  isKeyword: false,
};

export const RawNumberInputWithUnitsAndKeywords = <T extends string>({
  value,
  onChange,
  keywords,
  className,
  icon,
  nullable,
  notAllowedGlobalKeywords,
  ...rest
}: RawNumberInputWithUnitsAndKeywordsProps<T>) => {
  const hasKeywords = keywords && keywords.length > 0;

  const defaultUnit = rest.forceUnit ?? "px";

  const [isCustomValue, setIsCustomValue] = useState(() => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") {
      if (hasKeywords) {
        // Check if the value is a keyword from our options
        const isKeyword = keywords.some((option) => option.value === value);
        return !isKeyword;
      }
      // If no keywords, treat all strings as keywords (auto, inherit, etc.)
      return false;
    }
    return true; // Numeric values are always custom
  });

  const handleKeywordSelect = (selectedValue: string) => {
    if (selectedValue === "custom") {
      setIsCustomValue(true);
      // Keep the current value if it's numeric, otherwise set to auto
      if (typeof value === "object" && value !== null) {
        onChange(value as any);
      } else {
        onChange({ value: 0, unit: defaultUnit });
      }
    } else {
      setIsCustomValue(false);
      if (selectedValue === "null") {
        onChange(null as any);
      } else {
        onChange(selectedValue as any);
      }
    }
  };

  const handleCustomValueChange = useCallback(
    (newValue: NumberValueWithUnit | null) => {
      onChange(newValue as any);
    },
    [onChange, defaultUnit],
  );

  const t = useI18n();

  const filteredGlobalKeywords = useMemo(() => {
    return globalKeywords.filter(
      (keyword) => !notAllowedGlobalKeywords?.includes(keyword.value),
    );
  }, [notAllowedGlobalKeywords]);

  const globalKeywordsWithOrWithoutNullable = nullable
    ? [nullKeyword, ...filteredGlobalKeywords]
    : filteredGlobalKeywords;

  const allOptions = hasKeywords
    ? [...globalKeywordsWithOrWithoutNullable, ...keywords, customKeyword]
    : [...globalKeywordsWithOrWithoutNullable, customKeyword];

  // Find the current keyword value
  const currentKeyword = useMemo(
    () =>
      isCustomValue ? "custom" : typeof value === "string" ? value : "null",
    [isCustomValue, value],
  );

  return (
    <div className={cn("flex flex-col gap-2 w-full", className)}>
      <div className="flex flex-row gap-2 items-center w-full">
        {icon}
        <Combobox
          values={allOptions.map((option) => ({
            ...option,
            label: t(option.label as AllKeys),
          }))}
          value={currentKeyword}
          onItemSelect={handleKeywordSelect}
          className="w-full"
          size="xs"
        />

        {nullable && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => handleKeywordSelect("null")}
          >
            <X />
          </Button>
        )}
      </div>

      {isCustomValue && (
        <RawNumberInputWithUnit
          icon={<div />}
          defaultValue={
            typeof value === "object" && value !== null
              ? value
              : { value: 0, unit: defaultUnit }
          }
          onChange={handleCustomValueChange}
          nullable={false}
          {...rest}
        />
      )}
    </div>
  );
};
