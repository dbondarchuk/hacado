import type {
  AIMessage,
  BlockAICapability,
  BuilderAIResponse,
  BuilderDocumentSettings,
  BuilderKind,
  SelectionContextPayload,
} from "@hacado/builder-ai/client";
import type { TEditorBlock } from "@hacado/builder/editor";

export async function fetchBuilderAICapabilities(input: {
  builder: BuilderKind;
  blockType?: string;
}): Promise<{
  capabilities?: BlockAICapability[];
  documentActions?: BlockAICapability[];
  imageGenerationEnabled?: boolean;
}> {
  const params = new URLSearchParams({ builder: input.builder });

  if (input.blockType) {
    params.set("blockType", input.blockType);
  }

  const response = await fetch(`/api/builder-ai/capabilities?${params}`);

  if (!response.ok) {
    throw new Error("Failed to load AI capabilities");
  }

  return response.json();
}

export async function runBuilderAIChat(input: {
  builder: BuilderKind;
  document: TEditorBlock;
  documentRevision: string;
  selection: SelectionContextPayload;
  message: string;
  /** Prior turns only — current `message` is appended by the orchestrator. */
  messages?: AIMessage[];
  actionId?: string;
  conversationId?: string;
  documentId?: string;
  apps?: Array<{ appId: string; appName: string }>;
  args?: Record<string, unknown>;
  documentSettings?: BuilderDocumentSettings;
}): Promise<BuilderAIResponse> {
  const response = await fetch("/api/builder-ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Builder AI request failed");
  }

  return response.json();
}
