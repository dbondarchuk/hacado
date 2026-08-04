import { useLocale } from "@timelish/i18n/client";
import { is12hourUserTimeFormat } from "@timelish/utils";

export const use12HourFormat = () => {
  const locale = useLocale();
  return is12hourUserTimeFormat(locale);
};
