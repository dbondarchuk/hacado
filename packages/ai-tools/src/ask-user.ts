import type {
  AskUserKind,
  AskUserOption,
  AskUserRequest,
} from "@hacado/types/ai";

const ASK_USER_KINDS = new Set<AskUserKind>([
  "clarification",
  "confirmation",
  "preference",
]);

function parseOptions(value: unknown): AskUserOption[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;

  const options = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const record = item as Record<string, unknown>;
      const label = typeof record.label === "string" ? record.label.trim() : "";
      const optionValue =
        typeof record.value === "string" ? record.value.trim() : "";

      if (!label || !optionValue) return null;

      return { label, value: optionValue };
    })
    .filter((option): option is AskUserOption => Boolean(option));

  return options.length ? options : undefined;
}

/** Validate / normalize platform_askUser tool arguments. */
export function parseAskUserArgs(
  args: Record<string, unknown>,
): AskUserRequest | null {
  const question =
    typeof args.question === "string" ? args.question.trim() : "";

  const reason = typeof args.reason === "string" ? args.reason.trim() : "";
  const kind = args.kind;

  if (!question || !reason) return null;

  if (typeof kind !== "string" || !ASK_USER_KINDS.has(kind as AskUserKind)) {
    return null;
  }

  if (typeof args.required !== "boolean") return null;

  return {
    question,
    reason,
    required: args.required,
    kind: kind as AskUserKind,
    options: parseOptions(args.options),
    allowCustomAnswer:
      typeof args.allowCustomAnswer === "boolean"
        ? args.allowCustomAnswer
        : undefined,
  };
}

export function executeAskUser(args: Record<string, unknown>): {
  askUser?: AskUserRequest;
  error?: string;
} {
  const parsed = parseAskUserArgs(args);
  if (!parsed) {
    return {
      error:
        "Invalid askUser arguments. Require question, reason, required (boolean), and kind (clarification|confirmation|preference).",
    };
  }

  return { askUser: parsed };
}
