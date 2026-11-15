import type { EditorHistoryEntry, TEditorBlock } from "@hacado/builder/editor";
import type { BlockFilterRule } from "@hacado/builder/types";

export type BuilderKind = "page" | "footer" | "email";

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

export type AIToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
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

export type BlockSearchHit = {
  type: string;
  displayName: string;
  category: string;
  tags?: string[];
  capabilities?: string[];
  providerName?: string;
  allowedBuilderTypes?: string[];
  description?: string;
};

export type BlockSchemaResult = {
  type: string;
  schema: unknown;
  defaultValue?: unknown;
  allowedIn?: BlockFilterRule;
  tags?: string[];
  capabilities?: string[];
  providerName?: string;
};

export type BlockRelationship = {
  type: string;
  allowedIn?: BlockFilterRule;
  canContainChildren: boolean;
  providerName?: string;
};

export type StylePropertyHit = {
  name: string;
  category?: string;
  description?: string;
  responsive?: boolean;
};

export type StyleSchemaResult = {
  name: string;
  schema: unknown;
  category?: string;
};

export type DesignTokenHit = {
  name: string;
  category: string;
  value?: string;
};

export type BlockAICapability = {
  id: string;
  label: string;
  description: string;
  kind: "deterministic" | "generative";
  requiresConfirmation?: boolean;
};

export type DocumentStructureNode = {
  id: string;
  type: string;
  depth: number;
  parentId?: string | null;
  childIds: string[];
  summary?: string;
};

export type SelectionContextPayload = {
  builder: BuilderKind;
  documentId?: string;
  documentRevision: string;
  selectionType: "none" | "block" | "blocks" | "document" | "slot";
  selectedBlockIds: string[];
  selectedBlockTypes: string[];
  selectedSlot?: { blockId: string; slotId: string } | null;
};

export type DocumentProposal = {
  documentRevision: string;
  operations: EditorHistoryEntry[];
  summary: string;
  warnings?: string[];
};

export type ValidationIssue = {
  path: string;
  message: string;
  blockId?: string;
};

export type ValidationResult = {
  valid: boolean;
  issues: ValidationIssue[];
};

/**
 * Host-form fields outside the block tree (page SEO/settings, email subject, etc.).
 * Live unsaved values from the admin form — not loaded from DB in the chat route.
 */
export type BuilderDocumentSettings = {
  name?: string;
  title?: string;
  slug?: string;
  description?: string;
  keywords?: string;
  featuredImage?: string | null;
  published?: boolean;
  publishDate?: string;
  language?: string | null;
  tags?: string[];
  doNotCombine?: {
    title?: boolean;
    description?: boolean;
    keywords?: boolean;
  };
  headerId?: string;
  footerId?: string;
  fullWidth?: boolean;
  /** Email template subject — supports Mustache (`{{...}}`). */
  subject?: string;
};

/** Partial host-form settings patch (page SEO, email subject, etc.). */
export type DocumentSettingsProposal = {
  summary: string;
  settings: Partial<BuilderDocumentSettings>;
  warnings?: string[];
};

export type BuilderAIRequest = {
  builder: BuilderKind;
  documentId?: string;
  document: TEditorBlock;
  documentRevision: string;
  selection: SelectionContextPayload;
  message: string;
  conversationId?: string;
  messages?: AIMessage[];
  actionId?: string;
  /** Editor preview/template args (Mustache context), esp. for email. */
  args?: Record<string, unknown>;
  /** Page/email/footer settings from the host form (outside the block tree). */
  documentSettings?: BuilderDocumentSettings;
};

export type BuilderAIResponse = {
  conversationId: string;
  text: string;
  proposal?: DocumentProposal;
  settingsProposal?: DocumentSettingsProposal;
  usage: TokenUsage;
  model: string;
  provider: string;
  task: AITask;
};
