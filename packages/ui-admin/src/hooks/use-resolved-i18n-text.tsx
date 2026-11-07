"use client";

import { useI18n, useLocale } from "@hacado/i18n/client";
import { useCurrency, useTimeZone } from "@hacado/ui/context";
import {
  resolvedI18nText,
  type ResolvedI18nTextField,
} from "@hacado/utils/resolved-i18n-text";

export { resolvedI18nText } from "@hacado/utils/resolved-i18n-text";
export type { ResolvedI18nTextField as Field } from "@hacado/utils/resolved-i18n-text";

export function useResolvedI18nText(field: ResolvedI18nTextField): string {
  const t = useI18n();
  const timeZone = useTimeZone();
  const locale = useLocale();
  const currency = useCurrency();

  return resolvedI18nText(field, t, timeZone, locale, currency);
}

export const ResolvedI18nText = ({ text }: { text: ResolvedI18nTextField }) => {
  return useResolvedI18nText(text);
};
