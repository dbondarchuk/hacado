const MAX_PATHS = 120;
const MAX_DEPTH = 6;
const MAX_SAMPLE_STRING = 80;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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
    const entries = Object.entries(value).slice(0, 12);
    return Object.fromEntries(
      entries.map(([key, child]) => [key, truncateSample(child)]),
    );
  }

  return String(value);
}

function collectPaths(
  value: unknown,
  prefix: string,
  out: string[],
  depth: number,
) {
  if (out.length >= MAX_PATHS || depth > MAX_DEPTH) return;

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

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (out.length >= MAX_PATHS) break;

    const path = prefix ? `${prefix}.${key}` : key;

    if (child != null && typeof child === "object") {
      collectPaths(child, path, out, depth + 1);
    } else {
      out.push(path);
    }
  }
}

export type TemplateArgsSummary = {
  paths: string[];
  sample: Record<string, unknown>;
};

/** Slim mustache-oriented snapshot of editor preview args for the model. */
export function summarizeTemplateArgs(
  args: unknown,
): TemplateArgsSummary | undefined {
  if (!isPlainObject(args) || Object.keys(args).length === 0) {
    return undefined;
  }

  const paths: string[] = [];
  collectPaths(args, "", paths, 0);

  return {
    paths: paths.slice(0, MAX_PATHS),
    sample: truncateSample(args) as Record<string, unknown>,
  };
}
