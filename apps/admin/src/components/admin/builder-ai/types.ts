import type {
  AssistantStatus,
  DocumentProposal,
  DocumentSettingsProposal,
} from "@hacado/ai-builder-core/client";
import type {
  AiChatMessage,
  AiChatStreamSegment,
} from "@hacado/ui-admin-kit/ai";
import type { BuilderAIApplyError } from "./apply-error";

export const BUILDER_AI_TAB = "builder-ai";

export type AttachedBlock = {
  id: string;
  type: string;
  label: string;
};

export type BuilderAIStreamSegment = AiChatStreamSegment;

export type BuilderAIChatMessage = AiChatMessage & {
  attachedBlock?: AttachedBlock | null;
  proposal?: DocumentProposal | null;
  settingsProposal?: DocumentSettingsProposal | null;
  status?: AssistantStatus;
  /** Page slug awaiting explicit user confirmation before apply. */
  pendingSlug?: string | null;
  applyError?: BuilderAIApplyError | null;
  /** Document snapshot taken before this reply's proposal was applied (for retry revert). */
  documentBeforeApply?: unknown;
};

export type BuilderAIProgressStep = {
  id: string;
  label: string;
};
