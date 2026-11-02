"use client";

import {
  useFormatter as useFormatterNext,
  useLocale as useLocaleNext,
  useTranslations,
} from "next-intl";
import { useMemo } from "react";
import { wrapI18nFn } from "./missing-args";
import { I18nFn, I18nNamespaces } from "./types-core";

export { missingI18nArgsAsEmpty, wrapI18nFn } from "./missing-args";
export * from "./types-core";
export * from "./utils";

export const useI18n = <
  T extends I18nNamespaces | undefined = undefined,
  CustomKeys extends string | undefined = undefined,
>(
  namespace?: T,
) => {
  const t = useTranslations(namespace as any) as I18nFn<T, CustomKeys>;

  return useMemo(() => wrapI18nFn(t), [t]);
};

export const useLocale = useLocaleNext;

export const useFormatter = useFormatterNext;
