import type { AskUserRequest } from "@hacado/types/ai";

export type AiChatStreamSegment =
  | { type: "steps"; steps: string[] }
  | { type: "text"; text: string };

/** Minimal chat message shape shared by Builder, Blog, and other hosts. */
export type AiChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** @deprecated Prefer `segments` for chronological thought + text. */
  steps?: string[];
  segments?: AiChatStreamSegment[];
  askUser?: AskUserRequest | null;
  askUserAnswered?: boolean;
  replyToQuestion?: string | null;
  createdAt: number;
};
