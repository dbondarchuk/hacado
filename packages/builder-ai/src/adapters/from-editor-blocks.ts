import type {
  BuilderSchema,
  EditorDocumentBlocksDictionary,
} from "@hacado/builder/types";
import type { BuilderKind, DesignTokenHit } from "../types";
import {
  createRegistryAdapter,
  type RegistryAdapterOptions,
} from "./registry-adapter";
import type { BlockCatalogEntry, StyleCatalogEntry } from "./types";

export type EditorBlockSource = {
  type: string;
  displayName: string | { toString(): string };
  category: string | { toString(): string };
  tags?: string[];
  capabilities?: string[];
  allowedIn?: BlockCatalogEntry["allowedIn"];
  allowedBuilderTypes?: string[];
  hideInBlocksPanel?: boolean;
  providerName?: string;
  schema: BlockCatalogEntry["schema"];
  defaultValue?: unknown;
  description?: string;
};

export function catalogFromEditorBlocks(input: {
  schemas: BuilderSchema;
  editors: EditorDocumentBlocksDictionary;
  providerName?: string;
  providerNames?: Record<string, string>;
}): BlockCatalogEntry[] {
  return Object.keys(input.schemas).map((type) => {
    const editor = input.editors[type];
    const schema = input.schemas[type];

    return {
      type,
      displayName: String(editor?.displayName ?? type),
      category: String(editor?.category ?? "uncategorized"),
      tags: editor?.tags,
      capabilities: editor?.capabilities,
      allowedIn: editor?.allowedIn,
      allowedBuilderTypes: editor?.allowedBuilderTypes,
      hideInBlocksPanel: editor?.hideInBlocksPanel,
      providerName: input.providerNames?.[type] ?? input.providerName ?? "core",
      schema,
      defaultValue:
        typeof editor?.defaultValue === "function"
          ? undefined
          : editor?.defaultValue,
    };
  });
}

export function createAdapterFromCatalog(input: {
  builder: BuilderKind;
  blocks: BlockCatalogEntry[];
  styles?: StyleCatalogEntry[];
  designTokens?: DesignTokenHit[];
  cacheKeyPrefix?: string;
}) {
  const options: RegistryAdapterOptions = {
    builder: input.builder,
    blocks: input.blocks,
    styles: input.styles,
    designTokens: input.designTokens,
    cacheKeyPrefix: input.cacheKeyPrefix,
  };

  return createRegistryAdapter(options);
}

/**
 * Merge core page blocks with resolved app provider blocks.
 * First-wins for types already present in core (matches resolveProviders).
 */
export function mergeBlockCatalogs(
  core: BlockCatalogEntry[],
  appBlocks: BlockCatalogEntry[],
): BlockCatalogEntry[] {
  const byType = new Map(core.map((block) => [block.type, block]));

  for (const block of appBlocks) {
    if (!byType.has(block.type)) {
      byType.set(block.type, block);
    }
  }

  return [...byType.values()];
}
