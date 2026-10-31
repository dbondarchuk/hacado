/**
 * Lightweight i18n types for client/server runtime helpers.
 * Heavy key unions live in `./types-keys` and `@hacado/i18n/keys`.
 */

export type BaseI18nNamespaces =
  | "translation"
  | "admin"
  | "install"
  | "ui"
  | "apps"
  | "validation"
  | "builder";

export type I18nNamespaces = BaseI18nNamespaces | (string & {});

/**
 * Intentionally `string` so `@hacado/i18n/client` does not pull mega key
 * unions into every consumer. Prefer `@hacado/i18n/keys` when you need a
 * typed key union (e.g. `AdminKeys`, `BaseAllKeys`).
 */
export type AllKeys<
  _T extends I18nNamespaces = I18nNamespaces,
  _CustomKeys extends string | undefined = undefined,
> = string;

export type I18nKey<
  T extends I18nNamespaces | undefined = undefined,
  CustomKeys extends string | undefined = undefined,
> = CustomKeys extends string
  ? CustomKeys
  : AllKeys<NonNullable<T>, CustomKeys>;

type I18nBaseFn<
  T extends I18nNamespaces | undefined,
  CustomKeys extends string | undefined = undefined,
> = (key: I18nKey<T, CustomKeys>, args?: Record<string, any>) => string;

export type ChangeReturnType<T extends (...args: any[]) => any, NewReturn> = (
  ...args: Parameters<T>
) => NewReturn;

export type I18nFn<
  T extends I18nNamespaces | undefined,
  CustomKeys extends string | undefined = undefined,
> = I18nBaseFn<T, CustomKeys> & {
  rich: ChangeReturnType<I18nBaseFn<T, CustomKeys>, React.ReactNode>;
  markup: I18nBaseFn<T, CustomKeys>;
  raw: ChangeReturnType<I18nBaseFn<T, CustomKeys>, any>;
  has: (key: I18nKey<T, CustomKeys>) => boolean;
};

export {
  fallbackLanguage,
  getLocaleChain,
  isPartialLocale,
  languages,
  localeParents,
  partialLocales,
  resolveLanguageFromMap,
  toDateFnsLocale,
  type Language,
  type PartialLocale,
} from "./locale-catalog";
