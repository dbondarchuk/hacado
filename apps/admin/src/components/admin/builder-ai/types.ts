import type {
  DocumentProposal,
  DocumentSettingsProposal,
} from "@hacado/builder-ai/client";
import type { BuilderAIApplyError } from "./apply-error";

export const BUILDER_AI_TAB = "builder-ai";

export type AttachedBlock = {
  id: string;
  type: string;
  label: string;
};

export type BuilderAIChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachedBlock?: AttachedBlock | null;
  steps?: string[];
  proposal?: DocumentProposal | null;
  settingsProposal?: DocumentSettingsProposal | null;
  /** Page slug awaiting explicit user confirmation before apply. */
  pendingSlug?: string | null;
  applyError?: BuilderAIApplyError | null;
  /** Document snapshot taken before this reply's proposal was applied (for retry revert). */
  documentBeforeApply?: unknown;
  createdAt: number;
};

export type BuilderAIProgressStep = {
  id: string;
  label: string;
};
