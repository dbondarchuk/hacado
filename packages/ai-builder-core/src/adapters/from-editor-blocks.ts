import type {
  BuilderSchema,
  EditorDocumentBlocksDictionary,
} from "@hacado/builder/types";
import { resolveCatalogDefaultValue } from "../operations/hydrate-defaults";
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
  aiCapabilities?: BlockCatalogEntry["aiCapabilities"];
  allowedIn?: BlockCatalogEntry["allowedIn"];
  allowedChildren?: BlockCatalogEntry["allowedChildren"];
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
      aiCapabilities: editor?.aiCapabilities,
      allowedIn: editor?.allowedIn,
      allowedChildren: editor?.allowedChildren,
      allowedBuilderTypes: editor?.allowedBuilderTypes,
      hideInBlocksPanel: editor?.hideInBlocksPanel,
      providerName: input.providerNames?.[type] ?? input.providerName ?? "core",
      schema,
      defaultValue: resolveCatalogDefaultValue(editor?.defaultValue),
    };
  });
}

/**
 * Server-safe catalog: schemas + defaults map only (no React editor dictionary).
 * Prefer this in API / Node paths so defaultValue hydrate works without UI imports.
 */
export function catalogFromSchemas(input: {
  schemas: BuilderSchema;
  defaults?: Record<string, unknown>;
  providerName?: string;
  providerNames?: Record<string, string>;
  meta?: Record<
    string,
    Partial<
      Pick<
        BlockCatalogEntry,
        | "displayName"
        | "category"
        | "tags"
        | "capabilities"
        | "aiCapabilities"
        | "allowedIn"
        | "allowedChildren"
        | "allowedBuilderTypes"
        | "hideInBlocksPanel"
      >
    >
  >;
}): BlockCatalogEntry[] {
  return Object.keys(input.schemas).map((type) => {
    const meta = input.meta?.[type];

    return {
      type,
      displayName: String(meta?.displayName ?? type),
      category: String(meta?.category ?? "uncategorized"),
      tags: meta?.tags,
      capabilities: meta?.capabilities,
      aiCapabilities: meta?.aiCapabilities,
      allowedIn: meta?.allowedIn,
      allowedChildren: meta?.allowedChildren,
      allowedBuilderTypes: meta?.allowedBuilderTypes,
      hideInBlocksPanel: meta?.hideInBlocksPanel,
      providerName: input.providerNames?.[type] ?? input.providerName ?? "core",
      schema: input.schemas[type],
      defaultValue: resolveCatalogDefaultValue(input.defaults?.[type]),
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
 * App providers win on type collisions (e.g. waitlist BookingModern overlay).
 */
export function mergeBlockCatalogs(
  core: BlockCatalogEntry[],
  appBlocks: BlockCatalogEntry[],
): BlockCatalogEntry[] {
  const byType = new Map(core.map((block) => [block.type, block]));

  for (const block of appBlocks) {
    byType.set(block.type, block);
  }

  return [...byType.values()];
}
