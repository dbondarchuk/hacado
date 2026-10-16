import type admin from "./locales/en/admin.generated";
import type apps from "./locales/en/apps.generated";
import type builder from "./locales/en/builder.generated";
import type install from "./locales/en/install.generated";
import type translation from "./locales/en/translation.generated";
import type ui from "./locales/en/ui.generated";
import type validation from "./locales/en/validation.generated";

type Leaves<T> = T extends object
  ? {
      [K in keyof T]: `${Exclude<K, symbol>}${Leaves<T[K]> extends never
        ? ""
        : `.${Leaves<T[K]>}`}`;
    }[keyof T]
  : never;

export type BaseI18nNamespaces =
  | "translation"
  | "admin"
  | "install"
  | "ui"
  | "apps"
  | "validation"
  | "builder";

export type I18nNamespaces = BaseI18nNamespaces | (string & {});

export type TranslationKeys = Leaves<typeof translation>;
export type AdminKeys = Leaves<typeof admin>;
export type InstallKeys = Leaves<typeof install>;
export type UiKeys = Leaves<typeof ui>;
export type AppsKeys = Leaves<typeof apps>;
export type ValidationKeys = Leaves<typeof validation>;
export type BuilderKeys = Leaves<typeof builder>;

export type I18nKeys =
  | TranslationKeys
  | AdminKeys
  | InstallKeys
  | UiKeys
  | AppsKeys
  | ValidationKeys
  | BuilderKeys;

type _I18nKey<
  T extends I18nNamespaces,
  CustomKeys extends string | undefined = undefined,
> = T extends "translation"
  ? TranslationKeys
  : T extends "admin"
    ? AdminKeys
    : T extends "install"
      ? InstallKeys
      : T extends "ui"
        ? UiKeys
        : T extends "apps"
          ? AppsKeys
          : T extends "validation"
            ? ValidationKeys
            : T extends "builder"
              ? BuilderKeys
              : NonNullable<CustomKeys> extends never
                ? string
                : NonNullable<CustomKeys>;

export type AllKeys<
  T extends I18nNamespaces = I18nNamespaces,
  CustomKeys extends string | undefined = undefined,
> = {
  [K in T]: `${K}.${_I18nKey<K, CustomKeys>}`;
}[T];

export type BaseAllKeys = {
  [K in BaseI18nNamespaces]: `${K}.${_I18nKey<K>}`;
}[BaseI18nNamespaces];

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
