import type { Keys as AdminKeys } from "./locales/en/admin.keys";
import type { Keys as AppsKeys } from "./locales/en/apps.keys";
import type { BaseAllKeys } from "./locales/en/base-all.keys";
import type { Keys as BuilderKeys } from "./locales/en/builder.keys";
import type { Keys as InstallKeys } from "./locales/en/install.keys";
import type { Keys as TranslationKeys } from "./locales/en/translation.keys";
import type { Keys as UiKeys } from "./locales/en/ui.keys";
import type { Keys as ValidationKeys } from "./locales/en/validation.keys";

export type {
  AdminKeys,
  AppsKeys,
  BaseAllKeys,
  BuilderKeys,
  InstallKeys,
  TranslationKeys,
  UiKeys,
  ValidationKeys,
};

export type BaseI18nNamespaces =
  | "translation"
  | "admin"
  | "install"
  | "ui"
  | "apps"
  | "validation"
  | "builder";

export type I18nNamespaces = BaseI18nNamespaces | (string & {});

export type I18nKeys =
  | TranslationKeys
  | AdminKeys
  | InstallKeys
  | UiKeys
  | AppsKeys
  | ValidationKeys
  | BuilderKeys;

type NamespaceKeys = {
  translation: TranslationKeys;
  admin: AdminKeys;
  install: InstallKeys;
  ui: UiKeys;
  apps: AppsKeys;
  validation: ValidationKeys;
  builder: BuilderKeys;
};

type _I18nKey<
  T extends I18nNamespaces,
  CustomKeys extends string | undefined = undefined,
> = T extends keyof NamespaceKeys
  ? NamespaceKeys[T]
  : NonNullable<CustomKeys> extends never
    ? string
    : NonNullable<CustomKeys>;

/** Intentionally string. Prefixed unions are generated in .keys.d.ts files. */
export type AllKeys<
  _T extends I18nNamespaces = I18nNamespaces,
  _CustomKeys extends string | undefined = undefined,
> = string;

export type I18nKey<
  T extends I18nNamespaces | undefined,
  CustomKeys extends string | undefined = undefined,
> = T extends undefined ? AllKeys : _I18nKey<NonNullable<T>, CustomKeys>;

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

// export type Translations = {
//   [x: string]: Translations | string;
// };

// export const defaultNamespace: I18nNamespaces = "translation";

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
