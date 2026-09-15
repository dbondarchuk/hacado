import { useI18n } from "@hacado/i18n/client";
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

export type BooleanSelectProps = {
  value?: boolean;
  disabled?: boolean;
  trueLabel?: React.ReactNode;
  falseLabel?: React.ReactNode;
  className?: string;
  placeholder?: string;
} & (
  | {
      nullable?: false;
      onValueChange: (value: boolean) => void;
      nullableText?: never;
    }
  | {
      nullable: true;
      nullableText?: string;
      onValueChange: (value: boolean | undefined) => void;
    }
);

export const BooleanSelect: React.FC<BooleanSelectProps> = ({
  value,
  onValueChange,
  disabled,
  trueLabel,
  falseLabel,
  className,
  placeholder,
  nullable,
  nullableText,
}) => {
  const t = useI18n("ui");

  const defaultTrueLabel = t("booleanSelect.yes");
  const defaultFalseLabel = t("booleanSelect.no");
  const defaultPlaceholder = t("common.placeholder");

  return (
    <Select
      value={value?.toString()}
      onValueChange={(value) => {
        if (value === "undefined" && nullable) {
          onValueChange(undefined);
        } else {
          onValueChange(value === "true");
        }
      }}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder || defaultPlaceholder} />
      </SelectTrigger>
      <SelectContent>
        {nullable && (
          <SelectItem value="undefined">
            {nullableText || placeholder || defaultPlaceholder}
          </SelectItem>
        )}
        <SelectItem value="false">{falseLabel || defaultFalseLabel}</SelectItem>
        <SelectItem value="true">{trueLabel || defaultTrueLabel}</SelectItem>
      </SelectContent>
    </Select>
  );
};
