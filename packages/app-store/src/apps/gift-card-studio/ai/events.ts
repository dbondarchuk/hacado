import type { AllKeys } from "@hacado/i18n";
import type { AskUserRequest } from "@hacado/types/ai";

/** Gift-card-owned process SSE event names (not platform vocabulary). */
export const GIFT_CARD_AI_SSE_PROGRESS = "gift-card-ai.progress" as const;
export const GIFT_CARD_AI_SSE_DELTA = "gift-card-ai.delta" as const;
export const GIFT_CARD_AI_SSE_ASK_USER = "gift-card-ai.ask-user" as const;

export type GiftCardAiProgressPayload = {
  phase: "preparing" | "generating" | "parsing" | "tool";
  label: string;
  /** Full AllKeys for unnamespaced `useI18n()`. */
  labelKey?: AllKeys;
  tool?: string;
  stepPhase?: "start" | "done";
};

export type GiftCardAiDeltaPayload = {
  text: string;
};

export type GiftCardAiAskUserPayload = AskUserRequest;
