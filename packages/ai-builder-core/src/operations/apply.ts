import type { EditorHistoryEntry } from "@hacado/builder/editor-types";
import { normalizeEditorOperations } from "./normalize";
import { assertDocumentRevision } from "./revision";

export type ApplyProposalInput = {
  document: unknown;
  expectedRevision: string;
  operations: EditorHistoryEntry[];
  dispatch: (entry: EditorHistoryEntry) => void;
};

export type ApplyProposalResult =
  | { ok: true; applied: number }
  | { ok: false; reason: "stale_revision"; actualRevision: string }
  | { ok: false; reason: "empty" }
  | { ok: false; reason: "invalid_operations"; issues: string[] };

/**
 * Client-side helper: verify revision, then dispatch native history entries.
 */
export function applyDocumentProposal(
  input: ApplyProposalInput,
): ApplyProposalResult {
  if (!input.operations.length) {
    return { ok: false, reason: "empty" };
  }

  const normalized = normalizeEditorOperations(input.operations);

  if (normalized.issues.length || !normalized.operations.length) {
    return {
      ok: false,
      reason: "invalid_operations",
      issues: normalized.issues.length
        ? normalized.issues
        : ["No valid editor operations to apply"],
    };
  }

  const revision = assertDocumentRevision(
    input.document,
    input.expectedRevision,
  );

  if (!revision.ok) {
    return {
      ok: false,
      reason: "stale_revision",
      actualRevision: revision.actual,
    };
  }

  for (const operation of normalized.operations) {
    input.dispatch(operation);
  }

  return { ok: true, applied: normalized.operations.length };
}
