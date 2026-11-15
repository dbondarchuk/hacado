import type {
  AITask,
  BuilderDocumentSettings,
  BuilderKind,
  DocumentProposal,
  DocumentSettingsProposal,
} from "../types";

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

/** User only wants host-form subject/name changed — settings-only is enough. */
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
 * have no ops, an appointment body with zero Mustache, or an empty template
 * name that was not filled. Subject may be static; Mustache subject is
 * preferred via prompts, not enforced here.
 */
export function emailNeedsQualityFix(input: {
  builder: BuilderKind;
  task: AITask;
  message: string;
  documentSettings?: BuilderDocumentSettings;
  proposal: DocumentProposal | undefined;
  settingsProposal?: DocumentSettingsProposal | undefined;
}): boolean {
  if (input.builder !== "email") return false;
  if (input.task !== "document_generation") return false;
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

  return false;
}

export const EMAIL_QUALITY_NUDGE =
  "Email create is incomplete. Call proposeDocumentOperations with Heading + Text (appointment Mustache when it applies: {{fields.name}}, {{service.name}}, {{dateTime.full}}, {{member.name}}, {{config.name}}). Via proposeDocumentSettings: set name when empty (plain label, e.g. Appointment reminder); prefer a Mustache subject when date/service belong in the inbox line — static subjects (e.g. OTP) are fine. Do not hard-code business or Preview sample values.";
