import { I18nFn, I18nNamespaces } from "./types-core";

/**
 * Collect ICU placeholder names from a message.
 * Matches `{name}`, `{count, plural, ...}`, and nested args inside branches.
 */
export function extractIcuArgNames(message: string): string[] {
  const names = new Set<string>();
  const re = /\{(\w+)/g;
  let match: RegExpExecArray | null;

  while ((match = re.exec(message)) !== null) {
    names.add(match[1]!);
  }

  return [...names];
}

/**
 * intl-messageformat throws when a placeholder key is absent from `values`
 * (`"x" in values` is false). next-intl then falls back to the message key.
 * Copy args and set any missing placeholders to `""` so older stored args
 * still render the string.
 *
 * Must return a plain object - next-intl's prepareTranslationValues copies
 * own keys into a new object, so a Proxy would be stripped.
 */
export function missingI18nArgsAsEmpty(
  message: string,
  args: Record<string, any>,
): Record<string, any> {
  const names = extractIcuArgNames(message);
  if (names.length === 0) return args;

  let filled: Record<string, any> | undefined;

  for (const name of names) {
    if (name in args) continue;

    if (!filled) filled = { ...args };
    console.warn(`Missing argument for '${message}': ${name}`);
    filled[name] = "";
  }

  return filled ?? args;
}

function withFilledArgs<
  T extends I18nNamespaces | undefined,
  CustomKeys extends string | undefined,
>(
  t: I18nFn<T, CustomKeys>,
  key: Parameters<I18nFn<T, CustomKeys>>[0],
  args: Record<string, any> | undefined,
): Record<string, any> | undefined {
  if (args === undefined) return args;

  let raw: unknown;

  try {
    raw = t.raw(key);
  } catch {
    return args;
  }

  if (typeof raw !== "string") return args;

  return missingI18nArgsAsEmpty(raw, args);
}

/**
 * Wraps an i18n function to fill in missing ICU placeholder arguments with an empty string.
 * @param t - The i18n function to wrap.
 * @returns The wrapped i18n function.
 */
export function wrapI18nFn<
  T extends I18nNamespaces | undefined,
  CustomKeys extends string | undefined = undefined,
>(t: I18nFn<T, CustomKeys>): I18nFn<T, CustomKeys> {
  const translate = ((key, args) =>
    t(key, withFilledArgs(t, key, args))) as I18nFn<T, CustomKeys>;

  translate.rich = ((key, args) =>
    t.rich(key, withFilledArgs(t, key, args))) as I18nFn<T, CustomKeys>["rich"];

  translate.markup = ((key, args) =>
    t.markup(key, withFilledArgs(t, key, args))) as I18nFn<
    T,
    CustomKeys
  >["markup"];

  translate.raw = t.raw.bind(t) as I18nFn<T, CustomKeys>["raw"];
  translate.has = t.has.bind(t) as I18nFn<T, CustomKeys>["has"];

  return translate;
}
