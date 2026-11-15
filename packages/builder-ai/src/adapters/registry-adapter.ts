import type { EditorHistoryEntry, TEditorBlock } from "@hacado/builder/editor";
import type { BuilderSchema } from "@hacado/builder/types";
import { getRegisteredBlockAICapabilities } from "../capabilities/registry";
import {
  buildDocumentStructure,
  cloneBlockForInsert as cloneBlockSubtreeForInsert,
  findAncestorChain,
  findBlockById,
  getBlocksByIds as getDocumentBlocksByIds,
} from "../discovery/document-structure";
import { zodSchemaToJson } from "../discovery/schema-json";
import { searchBlockCatalog, searchStyleCatalog } from "../discovery/search";
import { validateOperationsAgainstDocument } from "../operations/validate";
import type {
  BlockAICapability,
  BlockRelationship,
  BlockSchemaResult,
  BlockSearchHit,
  BuilderKind,
  DesignTokenHit,
  DocumentStructureNode,
  SelectionContextPayload,
  StylePropertyHit,
  StyleSchemaResult,
  ValidationResult,
} from "../types";
import type {
  BlockCatalogEntry,
  BuilderAIAdapter,
  StyleCatalogEntry,
} from "./types";

export type RegistryAdapterOptions = {
  builder: BuilderKind;
  blocks: BlockCatalogEntry[];
  styles?: StyleCatalogEntry[];
  designTokens?: DesignTokenHit[];
  cacheKeyPrefix?: string;
};

export class RegistryBuilderAIAdapter implements BuilderAIAdapter {
  readonly builder: BuilderKind;
  private readonly blocks: BlockCatalogEntry[];
  private readonly styles: StyleCatalogEntry[];
  private readonly designTokens: DesignTokenHit[];
  private readonly cacheKeyPrefix: string;
  private readonly schemas: BuilderSchema;

  constructor(options: RegistryAdapterOptions) {
    this.builder = options.builder;
    this.blocks = options.blocks.filter((block) => {
      if (!block.allowedBuilderTypes?.length) return true;

      return block.allowedBuilderTypes.includes(options.builder);
    });

    this.styles = options.styles ?? [];
    this.designTokens = options.designTokens ?? [];
    this.cacheKeyPrefix = options.cacheKeyPrefix ?? options.builder;
    this.schemas = Object.fromEntries(
      this.blocks.map((block) => [block.type, block.schema]),
    );
  }

  async getBuilderContext() {
    return {
      builder: this.builder,
      blockCount: this.blocks.length,
      stylePropertyCount: this.styles.length,
    };
  }

  async searchBlocks(input: {
    query: string;
    category?: string;
    limit?: number;
  }): Promise<BlockSearchHit[]> {
    return searchBlockCatalog(this.blocks, input);
  }

  async getBlockSchemas(input: {
    blockTypes: string[];
  }): Promise<BlockSchemaResult[]> {
    return input.blockTypes
      .map((type) => this.blocks.find((block) => block.type === type))
      .filter((block): block is BlockCatalogEntry => Boolean(block))
      .map((block) => ({
        type: block.type,
        schema: zodSchemaToJson(
          block.schema,
          `${this.cacheKeyPrefix}:${block.type}`,
        ),
        defaultValue: block.defaultValue,
        allowedIn: block.allowedIn,
        tags: block.tags,
        capabilities: block.capabilities,
        providerName: block.providerName,
      }));
  }

  async getBlockRelationships(input: {
    blockTypes: string[];
  }): Promise<BlockRelationship[]> {
    return input.blockTypes
      .map((type) => this.blocks.find((block) => block.type === type))
      .filter((block): block is BlockCatalogEntry => Boolean(block))
      .map((block) => ({
        type: block.type,
        allowedIn: block.allowedIn,
        canContainChildren: true,
        providerName: block.providerName,
      }));
  }

  async searchStyleProperties(input: {
    query: string;
    blockType?: string;
    limit?: number;
  }): Promise<StylePropertyHit[]> {
    return searchStyleCatalog(this.styles, input);
  }

  async getStyleSchema(input: {
    properties: string[];
    blockType?: string;
  }): Promise<StyleSchemaResult[]> {
    return input.properties
      .map((name) => this.styles.find((style) => style.name === name))
      .filter((style): style is StyleCatalogEntry => Boolean(style))
      .map((style) => ({
        name: style.name,
        schema: style.schema ?? { type: "unknown" },
        category: style.category,
      }));
  }

  async getDesignTokens(input?: {
    categories?: string[];
  }): Promise<DesignTokenHit[]> {
    if (!input?.categories?.length) return this.designTokens;

    return this.designTokens.filter((token) =>
      input.categories!.includes(token.category),
    );
  }

  getDocumentStructure(document: TEditorBlock): DocumentStructureNode[] {
    return buildDocumentStructure(document);
  }

  getSelectionContext(
    document: TEditorBlock,
    selection: SelectionContextPayload,
  ) {
    const structure = this.getDocumentStructure(document);
    const blocks = selection.selectedBlockIds
      .map((id) => findBlockById(document, id))
      .filter((block): block is TEditorBlock => Boolean(block))
      .map((block) => ({
        id: block.id,
        type: block.type,
        data: block.data,
      }));

    const ancestors =
      selection.selectedBlockIds[0] != null
        ? findAncestorChain(structure, selection.selectedBlockIds[0])
        : [];

    return { blocks, ancestors };
  }

  getBlocksByIds(document: TEditorBlock, blockIds: string[]) {
    return getDocumentBlocksByIds(document, blockIds);
  }

  cloneBlockForInsert(document: TEditorBlock, blockId: string) {
    return cloneBlockSubtreeForInsert(document, blockId);
  }

  async getBlockAICapabilities(input: {
    blockType: string;
  }): Promise<BlockAICapability[]> {
    const entry = this.blocks.find((block) => block.type === input.blockType);

    return getRegisteredBlockAICapabilities({
      blockType: input.blockType,
      tags: entry?.tags,
      capabilities: entry?.capabilities,
    });
  }

  getSchemas(): BuilderSchema {
    return this.schemas;
  }

  async validateOperations(input: {
    document: TEditorBlock;
    operations: EditorHistoryEntry[];
  }): Promise<ValidationResult> {
    return validateOperationsAgainstDocument({
      document: input.document,
      operations: input.operations,
      schemas: this.schemas,
    });
  }
}

export function createRegistryAdapter(
  options: RegistryAdapterOptions,
): RegistryBuilderAIAdapter {
  return new RegistryBuilderAIAdapter(options);
}
