import type { Language } from "@hacado/i18n";
import type { Currency } from "@hacado/types";
import { formatAmount, stripMarkdown } from "@hacado/utils";
import {
  type CatalogSource,
  type DurationFormat,
  type DurationStyle,
  getCatalogProperty,
} from "./properties";
import type { CatalogRecord } from "./record";

export type ResolvedCatalogValue =
  | { kind: "text"; text: string }
  | { kind: "markdown"; markdown: string }
  | { kind: "empty" };

const hourWord = (count: number, style: DurationStyle) => {
  if (style === "short") return "hr";
  return count === 1 ? "hour" : "hours";
};

const minuteWord = (count: number, style: DurationStyle) => {
  if (style === "long") return count === 1 ? "minute" : "minutes";
  return "min";
};

export function formatDuration(
  minutes: number,
  format: DurationFormat,
  style: DurationStyle,
) {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const mins = total % 60;

  if (format === "duration") return String(total);
  if (format === "hours") return `${hours} ${hourWord(hours, style)}`;
  if (format === "minutes") return `${total} ${minuteWord(total, style)}`;

  if (hours > 0 && mins > 0) {
    return `${hours} ${hourWord(hours, style)} ${mins} ${minuteWord(mins, style)}`;
  }
  if (hours > 0) return `${hours} ${hourWord(hours, style)}`;
  return `${mins} ${minuteWord(mins, style)}`;
}

export function formatCatalogPrice(
  amount: number,
  language: Language,
  currency: Currency,
  options?: { showCurrency?: boolean; alwaysShowCents?: boolean },
) {
  const showCurrency = options?.showCurrency ?? false;
  const alwaysShowCents = options?.alwaysShowCents ?? false;
  const rounded = formatAmount(amount);
  const hasCents = Math.abs(rounded % 1) > 0;
  const fractionDigits = alwaysShowCents || hasCents ? 2 : 0;

  return new Intl.NumberFormat(language, {
    style: showCurrency ? "currency" : "decimal",
    ...(showCurrency
      ? {
          currency,
          currencyDisplay: currency === "USD" ? "narrowSymbol" : "symbol",
        }
      : {}),
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  } as Intl.NumberFormatOptions).format(rounded);
}

export function resolveCatalogValue({
  record,
  source,
  property,
  stripFormatting,
  durationFormat = "hoursMinutes",
  durationStyle = "medium",
  showCurrency = false,
  alwaysShowCents = false,
  formatPrice,
}: {
  record: CatalogRecord | null;
  source: CatalogSource | null | undefined;
  property: string | null | undefined;
  stripFormatting?: boolean | null;
  durationFormat?: DurationFormat | null;
  durationStyle?: DurationStyle | null;
  showCurrency?: boolean | null;
  alwaysShowCents?: boolean | null;
  formatPrice: (
    amount: number,
    options: { showCurrency: boolean; alwaysShowCents: boolean },
  ) => string;
}): ResolvedCatalogValue {
  const definition = getCatalogProperty(source, property);
  if (!record || !definition) return { kind: "empty" };

  const raw = record[definition.id as keyof CatalogRecord];
  if (raw == null || raw === "") return { kind: "empty" };

  if (definition.kind === "price") {
    const amount = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(amount)) return { kind: "empty" };
    return {
      kind: "text",
      text: formatPrice(amount, {
        showCurrency: !!showCurrency,
        alwaysShowCents: !!alwaysShowCents,
      }),
    };
  }

  if (definition.kind === "duration") {
    const minutes = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(minutes)) return { kind: "empty" };
    return {
      kind: "text",
      text: formatDuration(
        minutes,
        durationFormat ?? "hoursMinutes",
        durationStyle ?? "medium",
      ),
    };
  }

  const text = String(raw);
  if (definition.kind === "multiline" && !stripFormatting) {
    return { kind: "markdown", markdown: text };
  }

  return {
    kind: "text",
    text: definition.kind === "multiline" ? stripMarkdown(text) : text,
  };
}
