import { GatewayAIProvider } from "./gateway-provider";
import { MockAIProvider } from "./mock-provider";
import { OpenAIAIProvider } from "./openai-provider";
import type { AIProvider, ImageGenerationProvider } from "./types";

export type BuilderAIProviderKind = "gateway" | "openai" | "mock";

const providers = new Map<string, AIProvider>();
let imageProvider: ImageGenerationProvider | null = null;

export function registerAIProvider(provider: AIProvider) {
  providers.set(provider.id, provider);
}

export function getAIProvider(id?: string): AIProvider {
  const providerId =
    id ??
    process.env.BUILDER_AI_PROVIDER?.trim().toLowerCase() ??
    "gateway";
  const existing = providers.get(providerId);

  if (existing) return existing;

  const created = createDefaultAIProvider(providerId as BuilderAIProviderKind);
  providers.set(created.id, created);
  return created;
}

export function createDefaultAIProvider(
  kind: BuilderAIProviderKind = "gateway",
): AIProvider {
  if (kind === "mock") {
    return new MockAIProvider();
  }

  if (kind === "openai") {
    return new OpenAIAIProvider();
  }

  return new GatewayAIProvider();
}

export function registerImageGenerationProvider(
  provider: ImageGenerationProvider | null,
) {
  imageProvider = provider;
}

export function getImageGenerationProvider(): ImageGenerationProvider | null {
  if (imageProvider) return imageProvider;

  if (process.env.BUILDER_AI_IMAGE_GENERATION_ENABLED === "true") {
    return null;
  }

  return null;
}

export function resetAIProvidersForTests() {
  providers.clear();
  imageProvider = null;
}
