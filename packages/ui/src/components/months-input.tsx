import { useI18n } from "@hacado/i18n/client";
import React from "react";
import { Input } from "./input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
} from "./input-group";

export type MonthsInputProps = {
  value?: number;
  disabled?: boolean;
  onChange: (value: number | undefined) => void;
};

export const MonthsInput: React.FC<MonthsInputProps> = ({
  value,
  disabled,
  onChange,
}) => {
  const t = useI18n("ui");
  const total = value ?? 0;
  const years = Math.floor(total / 12);
  const months = total % 12;

  const emit = (nextYears: number, nextMonths: number) => {
    const next = nextYears * 12 + nextMonths;
    onChange(next > 0 ? next : undefined);
  };

  return (
    <div className="flex w-full items-center gap-2">
      <InputGroup className="flex-1">
        <InputGroupInput>
          <Input
            type="number"
            step={1}
            min={0}
            disabled={disabled}
            value={years}
            onChange={(e) =>
              emit(Math.floor(parseInt(e.target.value) || 0), months)
            }
            className={InputGroupInputClasses()}
          />
        </InputGroupInput>
        <InputGroupAddon className={InputGroupAddonClasses()}>
          {t("monthsInput.years")}
        </InputGroupAddon>
      </InputGroup>
      <InputGroup className="flex-1">
        <InputGroupInput>
          <Input
            type="number"
            step={1}
            min={0}
            disabled={disabled}
            value={months}
            onChange={(e) =>
              emit(years, Math.floor(parseInt(e.target.value) || 0))
            }
            className={InputGroupInputClasses()}
          />
        </InputGroupInput>
        <InputGroupAddon className={InputGroupAddonClasses()}>
          {t("monthsInput.months")}
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
};
