import type { AITask, AITaskConfiguration, ProviderCapabilities } from "../types";
import { BuilderAIError } from "../provider/errors";
import { getAIProvider } from "../provider/factory";
import { getModel } from "./registry";
import { getTaskConfiguration } from "./tasks";

export type ResolvedModel = AITaskConfiguration & {
  capabilities: ProviderCapabilities;
};

const TASK_REQUIREMENTS: Record<
  AITask,
  Partial<ProviderCapabilities>
> = {
  intent_classification: { textGeneration: true },
  capability_discovery: { textGeneration: true, toolCalling: true },
  document_planning: { textGeneration: true, toolCalling: true },
  document_generation: {
    textGeneration: true,
    toolCalling: true,
    structuredOutput: true,
  },
  document_editing: {
    textGeneration: true,
    toolCalling: true,
    structuredOutput: true,
  },
  copywriting: { textGeneration: true },
  layout_analysis: { textGeneration: true, vision: true },
  image_generation: { imageGeneration: true },
};

function assertCapabilities(
  task: AITask,
  capabilities: ProviderCapabilities,
  modelId: string,
) {
  const required = TASK_REQUIREMENTS[task];

  for (const [key, value] of Object.entries(required) as [
    keyof ProviderCapabilities,
    boolean | number | undefined,
  ][]) {
    if (value === true && !capabilities[key]) {
      throw new BuilderAIError({
        code: "model_unavailable",
        message: `Model ${modelId} does not support required capability ${key} for task ${task}`,
        retryable: false,
      });
    }
  }
}

export function resolveModelForTask(
  task: AITask,
  options?: { escalate?: boolean },
): ResolvedModel {
  const config = getTaskConfiguration(task);
  const useFallback = options?.escalate && config.fallback;
  const selected = useFallback
    ? {
        ...config,
        provider: config.fallback!.provider,
        model: config.fallback!.model,
      }
    : config;
  const modelMeta = getModel(selected.model);
  const provider = getAIProvider(selected.provider);
  const capabilities = modelMeta ?? {
    ...provider.getCapabilities(),
    id: selected.model,
    provider: selected.provider,
    displayName: selected.model,
    tier: "standard" as const,
  };

  assertCapabilities(task, capabilities, selected.model);

  return {
    ...selected,
    capabilities,
  };
}
