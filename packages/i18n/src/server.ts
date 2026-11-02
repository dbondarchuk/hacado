import { getLocale as getLocaleNext, getTranslations } from "next-intl/server";
import { wrapI18nFn } from "./missing-args";
import { I18nFn, I18nNamespaces, Language } from "./types-core";

export { missingI18nArgsAsEmpty, wrapI18nFn } from "./missing-args";
export * from "./types-core";
export * from "./utils";

type LanguageOptions = { locale: Language };

type Options<T extends I18nNamespaces | undefined = undefined> =
  LanguageOptions & { namespace: T };

type GetI18nAsyncArgsFn = ((
  args: LanguageOptions,
) => Promise<I18nFn<undefined>>) &
  (<
    T extends I18nNamespaces,
    CustomKeys extends string | undefined = undefined,
  >(
    args: T | Options<T>,
  ) => Promise<I18nFn<T, CustomKeys>>) &
  ((args?: undefined | Options) => Promise<I18nFn<undefined>>);

export const getI18nAsync = (async (args?: unknown) =>
  wrapI18nFn(
    await (getTranslations as (args?: unknown) => Promise<I18nFn<undefined>>)(
      args,
    ),
  )) as GetI18nAsyncArgsFn;

export const getLocale = getLocaleNext;
