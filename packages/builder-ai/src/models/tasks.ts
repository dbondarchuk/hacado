import type { AITask, AITaskConfiguration, ModelTier } from "../types";
import { getModelsByTier } from "./registry";

const TIER_BY_TASK: Record<AITask, ModelTier> = {
  intent_classification: "economy",
  capability_discovery: "economy",
  copywriting: "economy",
  document_editing: "standard",
  document_planning: "standard",
  document_generation: "premium",
  layout_analysis: "standard",
  image_generation: "standard",
};

function modelForTier(tier: ModelTier): AITaskConfiguration {
  const model = getModelsByTier(tier)[0];

  if (!model) {
    throw new Error(`No model registered for tier ${tier}`);
  }

  const premium = getModelsByTier("premium")[0];

  return {
    provider: model.provider,
    model: model.id,
    temperature: tier === "economy" ? 0.2 : 0.4,
    maxOutputTokens: tier === "premium" ? 16384 : 8192,
    fallback:
      premium &&
      (premium.id !== model.id || premium.provider !== model.provider)
        ? { provider: premium.provider, model: premium.id }
        : tier !== "premium" && premium
          ? // Keep premium as escalation target even when it currently shares a model id.
            { provider: premium.provider, model: premium.id }
          : undefined,
  };
}

function buildDefaultTaskConfiguration(): Record<AITask, AITaskConfiguration> {
  return {
    intent_classification: modelForTier("economy"),
    capability_discovery: modelForTier("economy"),
    copywriting: modelForTier("economy"),
    document_editing: modelForTier("standard"),
    document_planning: modelForTier("standard"),
    document_generation: modelForTier("premium"),
    layout_analysis: modelForTier("standard"),
    image_generation: modelForTier("standard"),
  };
}

let taskConfiguration: Record<AITask, AITaskConfiguration> =
  buildDefaultTaskConfiguration();

export function getDefaultTaskTier(task: AITask): ModelTier {
  return TIER_BY_TASK[task];
}

export function getTaskConfiguration(task: AITask): AITaskConfiguration {
  return taskConfiguration[task];
}

export function setTaskConfiguration(
  task: AITask,
  configuration: AITaskConfiguration,
) {
  taskConfiguration = {
    ...taskConfiguration,
    [task]: configuration,
  };
}

export function setAllTaskConfigurations(
  configurations: Partial<Record<AITask, AITaskConfiguration>>,
) {
  taskConfiguration = {
    ...taskConfiguration,
    ...configurations,
  };
}

export function resetTaskConfigurationForTests() {
  taskConfiguration = buildDefaultTaskConfiguration();
}
