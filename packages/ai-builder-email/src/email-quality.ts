import type {
  AITask,
  BuilderDocumentSettings,
  BuilderKind,
  DocumentProposal,
  DocumentSettingsProposal,
} from "@hacado/ai-builder-core";

const PLAIN_COPY_TYPES = new Set([
  "Text",
  "Heading",
  "Spacer",
  "Divider",
  "EmailLayout",
]);

const RICH_LAYOUT_TYPES = new Set([
  "Button",
  "Image",
  "Avatar",
  "Container",
  "Columns",
  "ConditionalContainer",
  "ForeachContainer",
  "OnlineMeeting",
  "CustomHTML",
]);

export function proposalContainsMustache(
  proposal: DocumentProposal | undefined,
): boolean {
  if (!proposal?.operations.length) return false;

  return JSON.stringify(proposal.operations).includes("{{");
}

export function isValidOpsProposal(
  proposal: DocumentProposal | undefined,
): proposal is DocumentProposal {
  return (
    !!proposal && !proposal.warnings?.length && proposal.operations.length > 0
  );
}

function walkBlockTypes(node: unknown, types: string[]): void {
  if (!node || typeof node !== "object") return;

  if (Array.isArray(node)) {
    for (const item of node) walkBlockTypes(item, types);

    return;
  }

  const record = node as Record<string, unknown>;

  if (typeof record.type === "string" && record.type.trim()) {
    // Skip Plate inline nodes (p, h1, …) - email blocks use PascalCase catalog ids.
    if (/^[A-Z]/.test(record.type)) {
      types.push(record.type);
    }
  }

  for (const value of Object.values(record)) {
    if (value && typeof value === "object") {
      walkBlockTypes(value, types);
    }
  }
}

/** Collect block type names from add/set operations in a proposal. */
export function collectProposalBlockTypes(
  proposal: DocumentProposal | undefined,
): string[] {
  if (!proposal?.operations.length) return [];

  const types: string[] = [];

  for (const operation of proposal.operations) {
    const value = (operation as { value?: unknown }).value;
    if (!value || typeof value !== "object") continue;

    const record = value as Record<string, unknown>;
    const block =
      record.block && typeof record.block === "object" ? record.block : record;

    walkBlockTypes(block, types);
  }

  return types;
}

/**
 * True when a create proposal is basically Heading/Text (plus spacer/divider)
 * with no CTA, image, or layout containers.
 */
export function isPlainTextHeavyEmailProposal(
  proposal: DocumentProposal | undefined,
): boolean {
  if (!isValidOpsProposal(proposal)) return false;

  const types = collectProposalBlockTypes(proposal);
  if (!types.length) return true;

  const hasRich = types.some((type) => RICH_LAYOUT_TYPES.has(type));
  if (hasRich) return false;

  const hasCopy = types.some((type) => type === "Text" || type === "Heading");

  return hasCopy && types.every((type) => PLAIN_COPY_TYPES.has(type));
}

/** User only wants host-form subject/name changed - settings-only is enough. */
export function looksLikeSubjectOnlyAsk(message: string): boolean {
  const text = message.toLowerCase();
  if (!/\bsubject\b/.test(text)) return false;

  return !/\b(body|content|heading|section|block|layout|template|reminder|confirmation|create|build|write|design|generate|make)\b/.test(
    text,
  );
}

/** Clear ask to create/rebuild email body content (not just subject). */
export function looksLikeEmailBodyCreate(message: string): boolean {
  if (looksLikeSubjectOnlyAsk(message)) return false;

  const text = message.toLowerCase();

  return (
    /\b(create|build|write|design|generate|make|rebuild)\b/.test(text) ||
    /\b(reminder|confirmation|cancel(?:led|lation)?|reschedul)\b/.test(text)
  );
}

export function looksLikeAppointmentEmailAsk(message: string): boolean {
  return /\b(appointment|reminder|confirmation|cancel(?:led|lation)?|reschedul|booking|visit)\b/i.test(
    message,
  );
}

function settingsHasName(
  settingsProposal: DocumentSettingsProposal | undefined,
): boolean {
  const name = settingsProposal?.settings?.name;

  return typeof name === "string" && name.trim().length > 0;
}

/**
 * Incomplete when the user clearly asked for email body content and we still
 * have no ops, an appointment body with zero Mustache, a text-only layout, or
 * an empty template name that was not filled.
 *
 * Intentionally not limited to `document_generation`: create-style asks are
 * often classified as `document_editing`, and settings-only (name/subject)
 * must not count as done without body operations.
 */
export function emailNeedsQualityFix(input: {
  builder: BuilderKind;
  task: AITask;
  message: string;
  documentSettings?: BuilderDocumentSettings;
  proposal?: DocumentProposal;
  settingsProposal?: DocumentSettingsProposal;
}): boolean {
  if (input.builder !== "email") return false;
  if (looksLikeSubjectOnlyAsk(input.message)) return false;
  if (!looksLikeEmailBodyCreate(input.message)) return false;

  if (!isValidOpsProposal(input.proposal)) return true;

  const nameEmpty = !String(input.documentSettings?.name ?? "").trim();

  if (nameEmpty && !settingsHasName(input.settingsProposal)) return true;

  if (
    looksLikeAppointmentEmailAsk(input.message) &&
    !proposalContainsMustache(input.proposal)
  ) {
    return true;
  }

  if (isPlainTextHeavyEmailProposal(input.proposal)) {
    return true;
  }

  return false;
}

export const EMAIL_QUALITY_NUDGE =
  "Email create is too plain or incomplete. Rebuild with a real email layout - not only Heading + Text. Use Container / Spacer / Divider for sections, include a primary Button CTA when there is an action (prefer Mustache links from getTemplateArgs like {{manageLink}}, {{bookingUrl}}, {{websiteUrl}}), and add Image/Avatar only via platform_searchStockImages when it helps. For appointments use Mustache: {{fields.name}}, {{service.name}}, {{dateTime.full}}, {{member.name}}, {{config.name}}. Via proposeDocumentSettings: set name when empty; prefer a Mustache subject when useful. Do not hard-code Preview samples.";
