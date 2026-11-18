import type { AIToolDefinition, AIToolUiMeta } from "@hacado/ai-core";
import type { AIToolStepEvent, AIToolStepPhase } from "@hacado/types/ai";

const DEFAULT_TOOL_UI: Required<AIToolUiMeta> = {
  label: "Working…",
  labelKey: "builder.ai.tools.working",
};

export function resolveToolUi(
  toolName: string,
  definitions: readonly AIToolDefinition[],
): Required<AIToolUiMeta> {
  const ui = definitions.find((definition) => definition.name === toolName)?.ui;

  return {
    label: ui?.label ?? DEFAULT_TOOL_UI.label,
    labelKey: ui?.labelKey ?? DEFAULT_TOOL_UI.labelKey,
  };
}

export function createToolStepEvent(
  tool: { id?: string; name: string },
  phase: AIToolStepPhase,
  definitions: readonly AIToolDefinition[],
): AIToolStepEvent {
  const { label, labelKey } = resolveToolUi(tool.name, definitions);

  return {
    type: "step",
    id: `${tool.id ?? tool.name}:${phase}`,
    label,
    labelKey,
    tool: tool.name,
    phase,
  };
}
