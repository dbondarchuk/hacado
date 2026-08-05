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
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  trueLabel?: React.ReactNode;
  falseLabel?: React.ReactNode;
  className?: string;
  placeholder?: string;
};

export const BooleanSelect: React.FC<BooleanSelectProps> = ({
  value,
  onValueChange,
  disabled,
  trueLabel,
  falseLabel,
  className,
  placeholder,
}) => {
  const t = useI18n("ui");

  const defaultTrueLabel = t("booleanSelect.yes");
  const defaultFalseLabel = t("booleanSelect.no");
  const defaultPlaceholder = t("common.placeholder");

  return (
    <Select
      value={value?.toString()}
      onValueChange={(value) => onValueChange(value === "true")}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder || defaultPlaceholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="false">{falseLabel || defaultFalseLabel}</SelectItem>
        <SelectItem value="true">{trueLabel || defaultTrueLabel}</SelectItem>
      </SelectContent>
    </Select>
  );
};
