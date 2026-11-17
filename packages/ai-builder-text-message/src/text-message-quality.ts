import type {
  AITask,
  BuilderDocumentSettings,
  BuilderKind,
  DocumentProposal,
  DocumentSettingsProposal,
} from "@hacado/ai-builder-core";
import { countSmsSegments, isGsmSmsCharset } from "@hacado/utils/sms-segments";
import { templateSafeWithError } from "@hacado/utils/string";

const MAX_PREFERRED_SEGMENTS = 2;

/** Fancy Latin punctuation that always balloons SMS encoding and is avoidable. */
const AVOIDABLE_NON_GSM_PUNCTUATION = /[—–‘’“”…]/u;

/**
 * Languages that can usually stay on GSM-7 without changing meaning.
 * Non-Latin scripts (uk, etc.) must use UCS-2; do not reject them for charset.
 */
export function prefersGsmCharset(language?: string | null): boolean {
  const code = String(language ?? "en")
    .trim()
    .toLowerCase()
    .split(/[_-]/)[0];

  return code === "en";
}

export function hasAvoidableNonGsmPunctuation(value: string): boolean {
  return AVOIDABLE_NON_GSM_PUNCTUATION.test(value);
}

export function settingsHasValue(
  settingsProposal: DocumentSettingsProposal | undefined,
): boolean {
  const value = settingsProposal?.settings?.value;

  return typeof value === "string" && value.trim().length > 0;
}

function settingsHasName(
  settingsProposal: DocumentSettingsProposal | undefined,
): boolean {
  const name = settingsProposal?.settings?.name;

  return typeof name === "string" && name.trim().length > 0;
}

export function looksLikeTextMessageBodyAsk(message: string): boolean {
  const text = message.toLowerCase();

  return (
    /\b(create|build|write|rewrite|shorten|improve|generate|make|draft|update|edit)\b/.test(
      text,
    ) ||
    /\b(reminder|confirmation|cancel(?:led|lation)?|otp|code|text|sms|message)\b/.test(
      text,
    )
  );
}

export function valueContainsMustache(value: string | undefined): boolean {
  return typeof value === "string" && value.includes("{{");
}

export function renderedSegmentCount(
  value: string,
  args?: Record<string, unknown>,
): number {
  const rendered = templateSafeWithError(value, args ?? {}, true);

  return countSmsSegments(String(rendered ?? value));
}

/**
 * Incomplete when the body is missing, name is empty on create, Mustache is
 * missing for appointment-like asks, or the rendered sample exceeds two
 * segments (silent length goal - not user-facing copy).
 */
export function textMessageNeedsQualityFix(input: {
  builder: BuilderKind;
  task: AITask;
  message: string;
  documentSettings?: BuilderDocumentSettings;
  proposal?: DocumentProposal;
  settingsProposal?: DocumentSettingsProposal;
  args?: Record<string, unknown>;
  language?: string | null;
}): boolean {
  if (input.builder !== "text-message") return false;
  if (!EDIT_TASKS.has(input.task)) return false;
  if (!looksLikeTextMessageBodyAsk(input.message)) return false;

  if (!settingsHasValue(input.settingsProposal)) return true;

  const nameEmpty = !String(input.documentSettings?.name ?? "").trim();

  if (nameEmpty && !settingsHasName(input.settingsProposal)) return true;

  const value = input.settingsProposal?.settings?.value ?? "";

  if (
    /\b(appointment|reminder|confirmation|cancel(?:led|lation)?|otp|booking)\b/i.test(
      input.message,
    ) &&
    !valueContainsMustache(value)
  ) {
    return true;
  }

  if (renderedSegmentCount(value, input.args) > MAX_PREFERRED_SEGMENTS) {
    return true;
  }

  if (hasAvoidableNonGsmPunctuation(value)) {
    return true;
  }

  if (prefersGsmCharset(input.language) && !isGsmSmsCharset(value)) {
    return true;
  }

  return false;
}

const EDIT_TASKS = new Set<AITask>([
  "document_editing",
  "document_generation",
  "copywriting",
]);

export const TEXT_MESSAGE_QUALITY_NUDGE =
  "Text-message create/edit is incomplete. Call getTemplateArgs, then proposeDocumentSettings with value (Mustache SMS body, max 500 chars) and name when empty. Write in the content language. Avoid em/en dashes and curly quotes. When the language fits GSM-7, prefer GSM-7 punctuation; otherwise write naturally in that script and keep it short (UCS-2 segments are smaller). Stay within two SMS segments after Mustache preview render. Do not call proposeDocumentOperations. Do not hard-code Preview sample values.";

/** Sentinel document so chat route revision checks succeed (no block tree). */
export const TEXT_MESSAGE_AI_SENTINEL_DOCUMENT = {
  id: "text-message-root",
  type: "TextMessageRoot",
  data: {},
};
