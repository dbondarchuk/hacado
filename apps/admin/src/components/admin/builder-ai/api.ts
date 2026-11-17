import type {
  AIMessage,
  BlockAICapability,
  BuilderAIResponse,
  BuilderDocumentSettings,
  BuilderKind,
  SelectionContextPayload,
} from "@hacado/ai-builder-core/client";
import { replaceUndefinedWithNull } from "@hacado/ai-builder-core/client";
import type { TEditorBlock } from "@hacado/builder/editor";

export type BuilderAIDocumentAction = {
  id: string;
  /** Full i18n key for `useI18n()` (e.g. `builder.ai.actions.improveDocument`). */
  labelKey: string;
  /** English fallback / chat message. */
  label: string;
  kind?: string;
};

export type BuilderAIStreamStep = {
  id: string;
  label: string;
  labelKey?: string;
  tool?: string;
  phase: "start" | "done";
};

export type BuilderAIStreamHandlers = {
  onStep?: (step: BuilderAIStreamStep) => void;
  onTextDelta?: (text: string) => void;
  onResult?: (result: BuilderAIResponse) => void;
  onError?: (error: { message: string; code?: string }) => void;
};

export async function fetchBuilderAICapabilities(input: {
  builder: BuilderKind;
  blockType?: string;
}): Promise<{
  capabilities?: BlockAICapability[];
  documentActions?: BuilderAIDocumentAction[];
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

function parseSseChunk(buffer: string): {
  events: Array<{ event: string; data: string }>;
  rest: string;
} {
  const events: Array<{ event: string; data: string }> = [];
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";

  for (const part of parts) {
    if (!part.trim()) continue;

    let event = "message";
    const dataLines: string[] = [];

    for (const line of part.split("\n")) {
      if (line.startsWith("event:")) {
        event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trim());
      }
    }

    if (dataLines.length) {
      events.push({ event, data: dataLines.join("\n") });
    }
  }

  return { events, rest };
}

export async function runBuilderAIChat(input: {
  builder: BuilderKind;
  document: TEditorBlock;
  documentRevision: string;
  selection: SelectionContextPayload;
  message: string;
  /** Prior turns only - current `message` is appended by the orchestrator. */
  messages?: AIMessage[];
  actionId?: string;
  conversationId?: string;
  documentId?: string;
  apps?: Array<{ appId: string; appName: string }>;
  args?: Record<string, unknown>;
  documentSettings?: BuilderDocumentSettings;
  signal?: AbortSignal;
  onStep?: BuilderAIStreamHandlers["onStep"];
  onTextDelta?: BuilderAIStreamHandlers["onTextDelta"];
}): Promise<BuilderAIResponse> {
  const response = await fetch("/api/builder-ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      ...input,
      // Keep empty Mustache keys (JSON drops `undefined`).
      args: input.args ? replaceUndefinedWithNull(input.args) : input.args,
    }),
    signal: input.signal,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Hacado AI request failed");
  }

  if (!response.body) {
    throw new Error("Hacado AI request failed");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: BuilderAIResponse | null = null;
  let streamError: { message: string; code?: string } | null = null;

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parsed = parseSseChunk(buffer);
    buffer = parsed.rest;

    for (const frame of parsed.events) {
      let data: unknown;

      try {
        data = JSON.parse(frame.data);
      } catch {
        continue;
      }

      if (frame.event === "step") {
        input.onStep?.(data as BuilderAIStreamStep);
      } else if (frame.event === "text-delta") {
        const text =
          data && typeof data === "object" && "text" in data
            ? String((data as { text: unknown }).text ?? "")
            : "";

        if (text) input.onTextDelta?.(text);
      } else if (frame.event === "result") {
        result = data as BuilderAIResponse;
      } else if (frame.event === "error") {
        streamError = data as { message: string; code?: string };
      }
    }
  }

  if (streamError) {
    throw new Error(streamError.message || "Hacado AI request failed");
  }

  if (!result) {
    throw new Error("Hacado AI request failed");
  }

  return result;
}
