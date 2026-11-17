import type {
  AskUserRequest,
  AssistantStatus,
  DocumentProposal,
  DocumentSettingsProposal,
} from "@hacado/ai-builder-core/client";
import type { BuilderAIApplyError } from "./apply-error";

export const BUILDER_AI_TAB = "builder-ai";

export type AttachedBlock = {
  id: string;
  type: string;
  label: string;
};

export type BuilderAIStreamSegment =
  | { type: "steps"; steps: string[] }
  | { type: "text"; text: string };

export type BuilderAIChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachedBlock?: AttachedBlock | null;
  /** @deprecated Prefer `segments` for chronological thought + text. */
  steps?: string[];
  /** Chronological stream: tool steps and text interleaved as they arrive. */
  segments?: BuilderAIStreamSegment[];
  proposal?: DocumentProposal | null;
  settingsProposal?: DocumentSettingsProposal | null;
  status?: AssistantStatus;
  /** Structured question from askUser - waits for answer/skip. */
  askUser?: AskUserRequest | null;
  askUserAnswered?: boolean;
  /** When this user message answers an askUser question, show that question. */
  replyToQuestion?: string | null;
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
