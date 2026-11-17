import {
  createAdapterFromCatalog,
  type BuilderAIAdapter,
} from "@hacado/ai-builder-core";

export function createTextMessageBuilderAIAdapter(): BuilderAIAdapter {
  return createAdapterFromCatalog({
    builder: "text-message",
    blocks: [],
    styles: [],
    cacheKeyPrefix: "text-message",
  });
}
