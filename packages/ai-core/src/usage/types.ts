import type { AITask, BuilderKind, TokenUsage } from "../types";

export type BuilderAIUsageEvent = {
  organizationId: string;
  builder: BuilderKind;
  task: AITask;
  provider: string;
  model: string;
  workflow?: string;
  operationType?: string;
  success: boolean;
  usage: TokenUsage;
  modelCalls: number;
  toolCalls: number;
  retries: number;
  escalations: number;
  durationMs: number;
  estimatedCostUsd?: number;
  conversationId?: string;
  errorCode?: string;
  timestamp: string;
};

export type UsageTracker = {
  track(event: BuilderAIUsageEvent): void | Promise<void>;
};
