/**
 * Single shared locale catalog for runtime and Node scripts
 * (`node --experimental-strip-types`).
 */

export const languages = [
  "en",
  "en-CA",
  "fr",
  "fr-CA",
  "es",
  "es-MX",
  "uk",
] as const;

export type Language = (typeof languages)[number];

export const partialLocales = ["en-CA", "fr-CA", "es-MX"] as const;

export type PartialLocale = (typeof partialLocales)[number];

/** Child locale -> immediate parent. Missing locales fall back to `en`. */
export const localeParents: Partial<Record<Language, Language>> = {
  "en-CA": "en",
  fr: "en",
  "fr-CA": "fr",
  es: "en",
  "es-MX": "es",
  uk: "en",
};

export const fallbackLanguage: Language = "en";

export function isPartialLocale(locale: string): locale is PartialLocale {
  return (partialLocales as readonly string[]).includes(locale);
}

/**
 * Returns the inheritance chain from most specific to root, e.g.
 * fr-CA -> [fr-CA, fr, en]
 */
export function getLocaleChain(locale: string): Language[] {
  const chain: Language[] = [];
  const seen = new Set<string>();
  let current: string | null = locale;

  while (current && !seen.has(current)) {
    seen.add(current);
    if ((languages as readonly string[]).includes(current)) {
      chain.push(current as Language);
    }
    current = localeParents[current as Language] ?? null;
    if (!current && !seen.has(fallbackLanguage)) {
      current = fallbackLanguage;
    }
  }

  if (!chain.includes(fallbackLanguage)) {
    chain.push(fallbackLanguage);
  }

  return chain;
}

/** date-fns/locale export keys for our Language codes. */
const dateFnsLocaleKeys: Record<Language, string> = {
  en: "enUS",
  "en-CA": "enCA",
  fr: "fr",
  "fr-CA": "frCA",
  es: "es",
  "es-MX": "es",
  uk: "uk",
};

/**
 * Resolve a value from a language-keyed map using the locale parent chain
 * (e.g. fr-CA → fr → en).
 */
export function resolveLanguageFromMap<T>(
  map: Partial<Record<string, T>> | undefined | null,
  locale: string,
): T | undefined {
  if (!map) return undefined;

  for (const lang of getLocaleChain(locale)) {
    if (lang in map && map[lang] !== undefined) {
      return map[lang];
    }
  }

  if (fallbackLanguage in map && map[fallbackLanguage] !== undefined) {
    return map[fallbackLanguage];
  }

  const first = Object.values(map).find((value) => value !== undefined);
  return first;
}

/**
 * Map a product language code to a `date-fns/locale` export name
 * (e.g. `fr-CA` -> `frCA`, `en` -> `enUS`).
 */
export function toDateFnsLocale(locale: string): string {
  if ((languages as readonly string[]).includes(locale)) {
    return dateFnsLocaleKeys[locale as Language];
  }

  const base = locale.split("-")[0];
  if ((languages as readonly string[]).includes(base)) {
    return dateFnsLocaleKeys[base as Language];
  }

  return dateFnsLocaleKeys.en;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Deep-merge source onto target. Plain objects recurse; strings, arrays, and
 * other values from source replace target.
 */
export function deepMergeMessages(target: unknown, source: unknown): unknown {
  if (!isPlainObject(source)) {
    return source;
  }

  const result: Record<string, unknown> = isPlainObject(target)
    ? { ...target }
    : {};

  for (const [key, value] of Object.entries(source)) {
    const existing = result[key];
    if (isPlainObject(value) && isPlainObject(existing)) {
      result[key] = deepMergeMessages(existing, value);
    } else {
      result[key] = value;
    }
  }

  return result;
}
