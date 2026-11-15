import type { AIModelCapabilities, ModelTier } from "../types";

const ECONOMY_MODEL: AIModelCapabilities = {
  id: "openai/gpt-6-luna",
  provider: "gateway",
  displayName: "GPT-6 Luna",
  tier: "economy",
  textGeneration: true,
  toolCalling: true,
  structuredOutput: true,
  vision: true,
  streaming: true,
  imageGeneration: false,
  maxContextTokens: 1050000,
  maxOutputTokens: 128000,
};

const STANDARD_MODEL: AIModelCapabilities = {
  id: "openai/gpt-6.1-terra",
  provider: "gateway",
  displayName: "GPT-6.1 Terra",
  tier: "standard",
  textGeneration: true,
  toolCalling: true,
  structuredOutput: true,
  vision: true,
  streaming: true,
  imageGeneration: false,
  maxContextTokens: 1050000,
  maxOutputTokens: 128000,
};

/**
 * Premium is a first-class tier so it can be remapped later.
 * Defaults to GPT-6.1 Terra until a stronger model is configured.
 */
const PREMIUM_MODEL: AIModelCapabilities = {
  id: "openai/gpt-6.1-terra",
  provider: "gateway",
  displayName: "GPT-6.1 Terra",
  tier: "premium",
  textGeneration: true,
  toolCalling: true,
  structuredOutput: true,
  vision: true,
  streaming: true,
  imageGeneration: false,
  maxContextTokens: 1050000,
  maxOutputTokens: 128000,
};

export const DEFAULT_MODELS: AIModelCapabilities[] = [
  ECONOMY_MODEL,
  STANDARD_MODEL,
  PREMIUM_MODEL,
];

const modelRegistry = new Map<string, AIModelCapabilities>([
  [ECONOMY_MODEL.id, ECONOMY_MODEL],
  [STANDARD_MODEL.id, STANDARD_MODEL],
]);

const modelsByTier = new Map<ModelTier, AIModelCapabilities>([
  ["economy", ECONOMY_MODEL],
  ["standard", STANDARD_MODEL],
  ["premium", PREMIUM_MODEL],
]);

export function registerModel(model: AIModelCapabilities) {
  modelRegistry.set(model.id, model);
  modelsByTier.set(model.tier, model);
}

export function getModel(id: string): AIModelCapabilities | undefined {
  return modelRegistry.get(id);
}

export function listModels(): AIModelCapabilities[] {
  return [...modelsByTier.values()];
}

export function getModelsByTier(tier: ModelTier): AIModelCapabilities[] {
  const model = modelsByTier.get(tier);
  return model ? [model] : [];
}
