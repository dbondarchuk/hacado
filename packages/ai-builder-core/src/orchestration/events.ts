import type { AIToolCall } from "../types";

export type BuilderAIStreamStepPhase = "start" | "done";

export type BuilderAIStreamStepEvent = {
  type: "step";
  id: string;
  label: string;
  labelKey?: string;
  tool?: string;
  phase: BuilderAIStreamStepPhase;
};

export type BuilderAIStreamTextDeltaEvent = {
  type: "text-delta";
  text: string;
};

export type BuilderAIStreamEvent =
  | BuilderAIStreamStepEvent
  | BuilderAIStreamTextDeltaEvent;

const TOOL_LABEL_KEYS: Record<string, string> = {
  searchBlocks: "tools.searchingBlocks",
  getBlockSchemas: "tools.loadingSchemas",
  getBlockRelationships: "tools.loadingRelationships",
  searchStyleProperties: "tools.searchingStyles",
  getStyleSchema: "tools.loadingStyles",
  getDesignTokens: "tools.loadingTokens",
  getDocumentStructure: "tools.inspectingDocument",
  getSelectedBlocks: "tools.inspectingSelection",
  getBlocksByIds: "tools.loadingBlocks",
  cloneBlockForInsert: "tools.cloningBlock",
  getBusinessProfile: "tools.loadingBusiness",
  getDocumentSettings: "tools.loadingSettings",
  getTemplateArgs: "tools.loadingTemplateArgs",
  searchDesignPatterns: "tools.searchingPatterns",
  searchStockImages: "tools.searchingImages",
  searchStockVideos: "tools.searchingVideos",
  searchPages: "tools.searchingPages",
  getConnectedApps: "tools.loadingApps",
  getBlockAICapabilities: "tools.loadingCapabilities",
  proposeDocumentOperations: "tools.proposingChanges",
  proposeDocumentSettings: "tools.proposingSettings",
  validateOperations: "tools.validatingChanges",
  askUser: "tools.askingUser",
};

const TOOL_LABELS: Record<string, string> = {
  searchBlocks: "Searching blocks…",
  getBlockSchemas: "Loading block schemas…",
  getBlockRelationships: "Checking block relationships…",
  searchStyleProperties: "Searching styles…",
  getStyleSchema: "Loading style schemas…",
  getDesignTokens: "Loading design tokens…",
  getDocumentStructure: "Inspecting the document…",
  getSelectedBlocks: "Inspecting the selection…",
  getBlocksByIds: "Loading blocks…",
  cloneBlockForInsert: "Cloning a section…",
  getBusinessProfile: "Loading business profile…",
  getDocumentSettings: "Loading document settings…",
  getTemplateArgs: "Loading template variables…",
  searchDesignPatterns: "Searching design patterns…",
  searchStockImages: "Searching stock images…",
  searchStockVideos: "Searching stock videos…",
  searchPages: "Searching pages…",
  getConnectedApps: "Loading connected apps…",
  getBlockAICapabilities: "Loading block actions…",
  proposeDocumentOperations: "Preparing proposed changes…",
  proposeDocumentSettings: "Preparing document settings…",
  validateOperations: "Validating changes…",
  askUser: "Asking you a question…",
};

export function toolStepLabel(toolName: string): {
  label: string;
  labelKey: string;
} {
  return {
    label: TOOL_LABELS[toolName] ?? "Working…",
    labelKey: TOOL_LABEL_KEYS[toolName] ?? "tools.working",
  };
}

export function createToolStepEvent(
  tool: AIToolCall | { id?: string; name: string },
  phase: BuilderAIStreamStepPhase,
): BuilderAIStreamStepEvent {
  const { label, labelKey } = toolStepLabel(tool.name);

  return {
    type: "step",
    id: `${tool.id ?? tool.name}:${phase}`,
    label,
    labelKey,
    tool: tool.name,
    phase,
  };
}
