import type { AllKeys } from "@hacado/i18n";
import type { AskUserRequest } from "@hacado/types/ai";

/** Blog-owned process SSE event names (not platform vocabulary). */
export const BLOG_AI_SSE_PROGRESS = "blog-ai.progress" as const;
export const BLOG_AI_SSE_DELTA = "blog-ai.delta" as const;
export const BLOG_AI_SSE_ASK_USER = "blog-ai.ask-user" as const;

export type BlogAiProgressPayload = {
  phase: "preparing" | "generating" | "parsing" | "tool";
  label: string;
  /** Full AllKeys for unnamespaced `useI18n()`. */
  labelKey?: AllKeys;
  tool?: string;
  stepPhase?: "start" | "done";
};

export type BlogAiDeltaPayload = {
  text: string;
};

export type BlogAiAskUserPayload = AskUserRequest;
