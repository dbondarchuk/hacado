import type { AllKeys } from "@hacado/i18n";

export type BuilderKind = "page" | "footer" | "email" | "text-message";

export type AITask =
  | "intent_classification"
  | "capability_discovery"
  | "document_planning"
  | "document_generation"
  | "document_editing"
  | "copywriting"
  | "layout_analysis"
  | "image_generation";

export type ModelTier = "economy" | "standard" | "premium";

export type AITaskConfiguration = {
  provider: string;
  model: string;
  temperature?: number;
  maxOutputTokens?: number;
  reasoningEffort?: string;
  fallback?: {
    provider: string;
    model: string;
  };
};

export type ProviderCapabilities = {
  textGeneration: boolean;
  toolCalling: boolean;
  structuredOutput: boolean;
  vision: boolean;
  streaming: boolean;
  imageGeneration: boolean;
  maxContextTokens?: number;
  maxOutputTokens?: number;
};

export type AIModelCapabilities = ProviderCapabilities & {
  id: string;
  provider: string;
  displayName: string;
  tier: ModelTier;
};

export type TokenUsage = {
  inputTokens?: number;
  outputTokens?: number;
  cachedInputTokens?: number;
  reasoningTokens?: number;
  totalTokens?: number;
};

export type NormalizedAIErrorCode =
  | "authentication"
  | "rate_limit"
  | "invalid_request"
  | "model_unavailable"
  | "timeout"
  | "provider_error"
  | "unknown";

export type NormalizedAIError = {
  code: NormalizedAIErrorCode;
  message: string;
  retryable: boolean;
  provider?: string;
  cause?: unknown;
};

export type AIMessageRole = "system" | "user" | "assistant" | "tool";

export type AIMessage = {
  role: AIMessageRole;
  content: string;
  name?: string;
  toolCallId?: string;
  /** Present on assistant messages that requested tool calls. */
  toolCalls?: AIToolCall[];
};

/** Host UI progress metadata — not sent to the model. */
export type AIToolUiMeta = {
  /** Fallback English label when i18n is unavailable. */
  label: string;
  /** Full i18n key for unnamespaced `useI18n()` (e.g. `builder.ai.tools.searchingBlocks`). */
  labelKey?: AllKeys;
};

export type AIToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  /** Progress / step label for host UIs (stripped before provider calls). */
  ui?: AIToolUiMeta;
};

export type AIToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type AIToolResult = {
  toolCallId: string;
  name: string;
  result: unknown;
  isError?: boolean;
};

export type GenerateInput = {
  task: AITask;
  messages: AIMessage[];
  tools?: AIToolDefinition[];
  temperature?: number;
  maxOutputTokens?: number;
  abortSignal?: AbortSignal;
  /**
   * Stable cache key for provider prompt caching (e.g. org + builder).
   * Helps OpenAI route similar prefixes; used with Gateway `caching: "auto"`.
   */
  promptCacheKey?: string;
};

export type GenerateResult = {
  text: string;
  toolCalls: AIToolCall[];
  usage: TokenUsage;
  finishReason?: string;
  model: string;
  provider: string;
  durationMs: number;
};

export type GenerateChunk =
  | { type: "text-delta"; textDelta: string }
  | { type: "tool-call"; toolCall: AIToolCall }
  | { type: "finish"; result: GenerateResult }
  | { type: "error"; error: NormalizedAIError };
