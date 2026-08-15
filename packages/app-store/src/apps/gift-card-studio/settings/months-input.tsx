import { useI18n } from "@hacado/i18n/client";
import {
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
} from "@hacado/ui";
import {
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
  giftCardStudioAdminNamespace,
} from "../translations/types";

export const MonthsInput: React.FC<{
  value: number;
  onChange: (value: number) => void;
}> = ({ value, onChange }) => {
  const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
    giftCardStudioAdminNamespace,
  );

  const years = Math.floor(value / 12);
  const months = value % 12;

  const handleYearsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.floor(parseInt(e.target.value) || 0);
    onChange(value * 12 + months);
  };

  const handleMonthsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.floor(parseInt(e.target.value) || 0);
    onChange(years * 12 + value);
  };

  return (
    <div className="flex w-full items-center gap-2">
      <InputGroup className="flex-1">
        <InputGroupInput>
          <Input
            type="number"
            step={1}
            min={0}
            value={years}
            onChange={(e) => handleYearsChange(e)}
            className={InputGroupInputClasses()}
          />
        </InputGroupInput>
        <InputGroupAddon className={InputGroupAddonClasses()}>
          {t("settings.years")}
        </InputGroupAddon>
      </InputGroup>
      <InputGroup className="flex-1">
        <InputGroupInput>
          <Input
            type="number"
            step={1}
            min={0}
            value={months}
            onChange={(e) => handleMonthsChange(e)}
            className={InputGroupInputClasses()}
          />
        </InputGroupInput>
        <InputGroupAddon className={InputGroupAddonClasses()}>
          {t("settings.months")}
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
};
