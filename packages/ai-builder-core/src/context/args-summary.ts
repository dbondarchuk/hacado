const MAX_DEPTH = 8;
const MAX_SAMPLE_STRING = 80;
const MAX_SAMPLE_ROOT_KEYS = 48;

/** Keys produced by `formatArguments` for Date / Luxon DateTime values. */
const DATE_TIME_FORMAT_KEYS = new Set([
  "original",
  "full",
  "medium",
  "short",
  "huge",
  "date",
  "dateHuge",
  "time",
  "timeWithSeconds",
  "relative",
  "sms",
  "isTomorrow",
  "iso",
  "timestamp",
  "day",
  "month",
  "year",
  "hour",
  "minute",
  "second",
]);

const DATE_TIME_LEAF_KEYS = [
  "full",
  "medium",
  "short",
  "huge",
  "date",
  "dateHuge",
  "time",
  "timeWithSeconds",
  "relative",
  "sms",
  "isTomorrow",
  "iso",
  "timestamp",
  "year",
  "hour",
  "minute",
  "second",
  "day.number",
  "day.text",
  "day.short",
  "month.number",
  "month.name",
  "month.short",
] as const;

/** Prefer Mustache-relevant roots when building the sample object. */
const SAMPLE_ROOT_PRIORITY = [
  "fields",
  "customer",
  "service",
  "member",
  "config",
  "dateTime",
  "endAt",
  "otp",
  "websiteUrl",
  "adminUrl",
  "manageLink",
  "waitlistEntry",
  "bookingUrl",
  "leaveWaitlistUrl",
  "giftCard",
  "paymentLink",
  "paymentLinkUrl",
  "package",
  "totalPrice",
  "totalPriceFormatted",
];

export type TemplateArgsFormatting = {
  dateTime: {
    description: string;
    keys: readonly string[];
    examples: string[];
  };
  amounts: {
    description: string;
    examples: string[];
  };
  links: {
    description: string;
    examples: string[];
  };
};

export type TemplateArgsSummary = {
  /** Top-level Mustache roots present on the live args object (includes app extras). */
  roots: string[];
  /** Leaf / usable Mustache paths. Formatted datetimes are listed once (e.g. `dateTime`). */
  paths: string[];
  sample: Record<string, unknown>;
  formatting: TemplateArgsFormatting;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * JSON / RSC serialization drops `undefined` keys. Convert them to `null` so
 * Mustache paths like `config.phone` stay visible to Builder AI even when empty.
 */
export function replaceUndefinedWithNull<T>(value: T): T {
  if (value === undefined) {
    return null as T;
  }

  if (value === null || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceUndefinedWithNull(item)) as T;
  }

  if (value instanceof Date) {
    return value;
  }

  const record = value as Record<string, unknown>;
  const next: Record<string, unknown> = {};

  for (const [key, child] of Object.entries(record)) {
    next[key] = child === undefined ? null : replaceUndefinedWithNull(child);
  }

  return next as T;
}

/** Detect objects produced by formatArguments for Date/DateTime values. */
export function isFormattedDateTime(
  value: unknown,
): value is Record<string, unknown> {
  if (!isPlainObject(value)) return false;

  const keys = Object.keys(value);
  if (keys.length < 8) return false;

  let hits = 0;
  for (const key of keys) {
    if (DATE_TIME_FORMAT_KEYS.has(key)) hits += 1;
  }

  return (
    hits >= 6 &&
    "sms" in value &&
    "full" in value &&
    ("iso" in value || "short" in value)
  );
}

function truncateSample(value: unknown): unknown {
  if (typeof value === "string") {
    return value.length > MAX_SAMPLE_STRING
      ? `${value.slice(0, MAX_SAMPLE_STRING)}…`
      : value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    value == null
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.length ? [truncateSample(value[0])] : [];
  }

  if (isPlainObject(value)) {
    if (isFormattedDateTime(value)) {
      return {
        short: truncateSample(value.short),
        sms: truncateSample(value.sms),
        full: truncateSample(value.full),
        date: truncateSample(value.date),
        time: truncateSample(value.time),
        _note:
          "Formatted datetime: append .sms / .full / .date / .time / ... (see formatting.dateTime)",
      };
    }

    const entries = Object.entries(value).slice(0, 16);
    return Object.fromEntries(
      entries.map(([key, child]) => [key, truncateSample(child)]),
    );
  }

  return String(value);
}

function orderRootEntries(
  entries: Array<[string, unknown]>,
): Array<[string, unknown]> {
  return [...entries].sort(([a], [b]) => {
    const ai = SAMPLE_ROOT_PRIORITY.indexOf(a);
    const bi = SAMPLE_ROOT_PRIORITY.indexOf(b);
    const aRank = ai === -1 ? SAMPLE_ROOT_PRIORITY.length : ai;
    const bRank = bi === -1 ? SAMPLE_ROOT_PRIORITY.length : bi;

    if (aRank !== bRank) return aRank - bRank;

    return a.localeCompare(b);
  });
}

function buildSample(args: Record<string, unknown>): Record<string, unknown> {
  const ordered = orderRootEntries(Object.entries(args)).slice(
    0,
    MAX_SAMPLE_ROOT_KEYS,
  );

  return Object.fromEntries(
    ordered.map(([key, child]) => [key, truncateSample(child)]),
  );
}

function collectPaths(
  value: unknown,
  prefix: string,
  out: string[],
  depth: number,
) {
  if (depth > MAX_DEPTH) return;

  // Keep null/undefined leaves so empty keys (e.g. config.phone) stay listed.
  if (value == null || typeof value !== "object") {
    if (prefix) out.push(prefix);
    return;
  }

  if (Array.isArray(value)) {
    if (prefix) out.push(prefix);

    if (value[0] != null && typeof value[0] === "object") {
      collectPaths(value[0], prefix, out, depth + 1);
    }

    return;
  }

  if (isFormattedDateTime(value)) {
    if (prefix) out.push(prefix);
    return;
  }

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (child != null && typeof child === "object") {
      collectPaths(child, path, out, depth + 1);
    } else {
      out.push(path);
    }
  }
}

function buildFormatting(paths: string[]): TemplateArgsFormatting {
  const dateRoots = paths.filter((path) => {
    const leaf = path.split(".").pop() ?? path;
    return (
      leaf === "dateTime" ||
      leaf === "endAt" ||
      leaf === "createdAt" ||
      leaf === "updatedAt" ||
      leaf.endsWith("At") ||
      leaf.endsWith("Date") ||
      leaf === "slot"
    );
  });

  const exampleRoot = dateRoots[0] ?? "dateTime";

  return {
    dateTime: {
      description:
        "Any Date/DateTime value is expanded by the host into a formatted object. List those roots once in paths (e.g. dateTime); do NOT expect separate path entries for each format. Append a format key in Mustache.",
      keys: DATE_TIME_LEAF_KEYS,
      examples: [
        `{{${exampleRoot}.sms}}`,
        `{{${exampleRoot}.short}}`,
        `{{${exampleRoot}.full}}`,
        `{{${exampleRoot}.date}}`,
        `{{${exampleRoot}.time}}`,
        `{{${exampleRoot}.day.text}}`,
      ],
    },
    amounts: {
      description:
        "Numeric keys containing amount/price also get a sibling `*Formatted` currency string from the host.",
      examples: ["{{totalPriceFormatted}}", "{{amountFormatted}}"],
    },
    links: {
      description:
        "Customer-facing URLs come from getTemplateArgs paths. Prefer those Mustache vars over inventing or askUser for links. Use optional sections when a link may be absent at send time (e.g. manageLink).",
      examples: [
        "{{websiteUrl}}",
        "{{#manageLink}}Manage: {{manageLink}}{{/manageLink}}",
        "{{bookingUrl}}",
        "{{leaveWaitlistUrl}}",
        "{{paymentLinkUrl}}",
      ],
    },
  };
}

/** Slim mustache-oriented snapshot of editor preview args for the model. */
export function summarizeTemplateArgs(
  args: unknown,
): TemplateArgsSummary | undefined {
  const normalized = replaceUndefinedWithNull(args);

  if (!isPlainObject(normalized) || Object.keys(normalized).length === 0) {
    return undefined;
  }

  const roots = Object.keys(normalized);
  const paths: string[] = [];
  collectPaths(normalized, "", paths, 0);

  return {
    roots,
    paths,
    sample: buildSample(normalized),
    formatting: buildFormatting(paths),
  };
}
