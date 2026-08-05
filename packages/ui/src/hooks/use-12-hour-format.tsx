import { useLocale } from "@hacado/i18n/client";
import { is12hourUserTimeFormat } from "@hacado/utils";

export const use12HourFormat = () => {
  const locale = useLocale();
  return is12hourUserTimeFormat(locale);
};
