/**
 * Heavy generated key unions. Import from `@hacado/i18n/keys` (or package
 * root) — not from `@hacado/i18n/client` / `server`.
 */
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

export type I18nKeys =
  | TranslationKeys
  | AdminKeys
  | InstallKeys
  | UiKeys
  | AppsKeys
  | ValidationKeys
  | BuilderKeys;
