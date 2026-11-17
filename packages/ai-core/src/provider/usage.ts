import type { TokenUsage } from "../types";

type SdkUsage = {
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  cachedInputTokens?: number | null;
  reasoningTokens?: number | null;
  inputTokenDetails?: {
    cacheReadTokens?: number | null;
  } | null;
  outputTokenDetails?: {
    reasoningTokens?: number | null;
  } | null;
};

export function toUsage(usage: SdkUsage): TokenUsage {
  return {
    inputTokens: usage.inputTokens ?? undefined,
    outputTokens: usage.outputTokens ?? undefined,
    totalTokens: usage.totalTokens ?? undefined,
    cachedInputTokens:
      usage.inputTokenDetails?.cacheReadTokens ??
      usage.cachedInputTokens ??
      undefined,
    reasoningTokens:
      usage.outputTokenDetails?.reasoningTokens ??
      usage.reasoningTokens ??
      undefined,
  };
}
