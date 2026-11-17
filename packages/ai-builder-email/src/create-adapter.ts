import {
  catalogFromEditorBlocks,
  createAdapterFromCatalog,
  type BuilderAIAdapter,
} from "@hacado/ai-builder-core";
import { EditorBlocks } from "@hacado/email-builder/blocks";
import { EditorBlocksSchema as EmailSchemas } from "@hacado/email-builder/blocks/schema";

export function createEmailBuilderAIAdapter(): BuilderAIAdapter {
  return createAdapterFromCatalog({
    builder: "email",
    blocks: catalogFromEditorBlocks({
      schemas: EmailSchemas,
      editors: EditorBlocks,
      providerName: "core",
    }),
    styles: [],
    cacheKeyPrefix: "email",
  });
}
