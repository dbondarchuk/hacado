import type {
  AIMessage,
  AITask,
  BuilderKind,
  TokenUsage,
} from "@hacado/ai-core";
import type {
  EditorHistoryEntry,
  TEditorBlock,
} from "@hacado/builder/editor-types";
import type { BlockFilterRule } from "@hacado/builder/types";
import type { AllKeys } from "@hacado/i18n";

export type {
  AIMessage,
  AIMessageRole,
  AIModelCapabilities,
  AITask,
  AITaskConfiguration,
  AIToolCall,
  AIToolDefinition,
  AIToolResult,
  BuilderKind,
  GenerateChunk,
  GenerateInput,
  GenerateResult,
  ModelTier,
  NormalizedAIError,
  NormalizedAIErrorCode,
  ProviderCapabilities,
  TokenUsage,
} from "@hacado/ai-core";

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

export type SupportedStyleInfo = {
  name: string;
  description?: string;
  category?: string;
};

export type BlockSchemaResult = {
  type: string;
  schema: unknown;
  /** Style keys this block accepts (with short docs). Full value defs via getStyleSchema. */
  supportedStyles?: SupportedStyleInfo[];
  defaultValue?: unknown;
  defaultMetadata?: Record<string, unknown>;
  /** Where this block may be placed (parent filter). */
  allowedIn?: BlockFilterRule;
  /** Which children may nest under this block (EditorChildren allow). */
  allowedChildren?: BlockFilterRule;
  tags?: string[];
  capabilities?: string[];
  providerName?: string;
};

export type BlockRelationship = {
  type: string;
  allowedIn?: BlockFilterRule;
  allowedChildren?: BlockFilterRule;
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
  description?: string;
};

export type DesignTokenHit = {
  name: string;
  category: string;
  value?: string;
};

export type BlockAICapabilityOption = {
  id: string;
  /** English fallback / chat message for the option. */
  label: string;
  /** Full i18n key for `useI18n()` (apps may use their own namespace). */
  labelKey: AllKeys;
  /** Message sent when selected; defaults to `label`. */
  message?: string;
};

export type BlockAICapability = {
  id: string;
  /** English fallback / chat message for the quick action. */
  label: string;
  /** Full i18n key for `useI18n()` (apps may use their own namespace). */
  labelKey: AllKeys;
  description: string;
  kind: "deterministic" | "generative";
  requiresConfirmation?: boolean;
  /** When set, UI renders a submenu instead of a single action. */
  options?: BlockAICapabilityOption[];
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
 * Live unsaved values from the admin form - not loaded from DB in the chat route.
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
  /** Email template subject - supports Mustache (`{{...}}`). */
  subject?: string;
  /** Text-message template body - Mustache (`{{...}}`), max 500 chars. */
  value?: string;
};

/** Partial host-form settings patch (page SEO, email subject, etc.). */
export type DocumentSettingsProposal = {
  summary: string;
  settings: Partial<BuilderDocumentSettings>;
  warnings?: string[];
};

export type AskUserKind = "clarification" | "confirmation" | "preference";

export type AskUserOption = {
  label: string;
  value: string;
};

/** Structured user interaction - not a document operation. */
export type AskUserRequest = {
  question: string;
  reason: string;
  required: boolean;
  kind: AskUserKind;
  options?: AskUserOption[];
  allowCustomAnswer?: boolean;
};

export type AssistantStatus =
  | "processing"
  | "waiting_for_user"
  | "completed"
  | "failed";

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
  status: AssistantStatus;
  askUser?: AskUserRequest;
  proposal?: DocumentProposal;
  settingsProposal?: DocumentSettingsProposal;
  usage: TokenUsage;
  model: string;
  provider: string;
  task: AITask;
};
