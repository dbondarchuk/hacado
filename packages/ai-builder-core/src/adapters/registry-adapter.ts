import type {
  EditorHistoryEntry,
  TEditorBlock,
} from "@hacado/builder/editor-types";
import type { BuilderSchema } from "@hacado/builder/types";
import { getBlockAICapabilitiesFromEntry } from "../capabilities/registry";
import {
  buildDocumentStructure,
  cloneBlockForInsert as cloneBlockSubtreeForInsert,
  findAncestorChain,
  findBlockById,
  getBlocksByIds as getDocumentBlocksByIds,
} from "../discovery/document-structure";
import {
  blockSchemaForAi,
  extractSupportedStyleProperties,
} from "../discovery/schema-json";
import { searchBlockCatalog, searchStyleCatalog } from "../discovery/search";
import { hydrateEditorOperations } from "../operations/hydrate-defaults";
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
  SupportedStyleInfo,
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
  private readonly defaultsByType: Map<string, unknown>;
  private readonly metadataByType: Map<string, Record<string, unknown>>;
  private readonly catalogByType: Map<string, BlockCatalogEntry>;

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

    this.catalogByType = new Map(
      this.blocks.map((block) => [block.type, block]),
    );

    this.defaultsByType = new Map(
      this.blocks
        .filter((block) => block.defaultValue != null)
        .map((block) => [block.type, block.defaultValue]),
    );

    this.metadataByType = new Map(
      this.blocks
        .filter((block) => block.defaultMetadata != null)
        .map((block) => [block.type, block.defaultMetadata!]),
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
      .map((block) => {
        const aiSchema = blockSchemaForAi(
          block.schema,
          `${this.cacheKeyPrefix}:${block.type}`,
        );

        return {
          type: block.type,
          schema: aiSchema.schema,
          supportedStyles: this.toSupportedStyles(
            aiSchema.supportedStyleProperties,
          ),
          defaultValue: block.defaultValue,
          defaultMetadata: block.defaultMetadata,
          allowedIn: block.allowedIn,
          allowedChildren: block.allowedChildren,
          tags: block.tags,
          capabilities: block.capabilities,
          providerName: block.providerName,
        };
      });
  }

  private toSupportedStyles(
    names: string[] | undefined,
  ): SupportedStyleInfo[] | undefined {
    if (!names?.length) return undefined;

    return names.map((name) => {
      const entry = this.styles.find((style) => style.name === name);

      return {
        name,
        description: entry?.description,
        category: entry?.category,
      };
    });
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
        allowedChildren: block.allowedChildren,
        canContainChildren: true,
        providerName: block.providerName,
      }));
  }

  private supportedStylesForBlock(blockType?: string): Set<string> | null {
    if (!blockType) return null;

    const block = this.blocks.find((entry) => entry.type === blockType);

    if (!block) return null;

    const names = extractSupportedStyleProperties(block.schema);

    return names ? new Set(names) : null;
  }

  async searchStyleProperties(input: {
    query: string;
    blockType?: string;
    limit?: number;
  }): Promise<StylePropertyHit[]> {
    const allowed = this.supportedStylesForBlock(input.blockType);

    return searchStyleCatalog(this.styles, {
      ...input,
      allowlist: allowed ? [...allowed] : undefined,
    });
  }

  async getStyleSchema(input: {
    properties: string[];
    blockType?: string;
  }): Promise<StyleSchemaResult[]> {
    const allowed = this.supportedStylesForBlock(input.blockType);

    return input.properties
      .filter((name) => (allowed ? allowed.has(name) : true))
      .map((name) => this.styles.find((style) => style.name === name))
      .filter((style): style is StyleCatalogEntry => Boolean(style))
      .map((style) => ({
        name: style.name,
        schema: style.schema ?? { type: "unknown" },
        category: style.category,
        description: style.description,
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

    return getBlockAICapabilitiesFromEntry({
      aiCapabilities: entry?.aiCapabilities,
    });
  }

  getSchemas(): BuilderSchema {
    return this.schemas;
  }

  hydrateOperations(operations: EditorHistoryEntry[]): EditorHistoryEntry[] {
    return hydrateEditorOperations(
      operations,
      this.defaultsByType,
      this.metadataByType,
    );
  }

  async validateOperations(input: {
    document: TEditorBlock;
    operations: EditorHistoryEntry[];
  }): Promise<ValidationResult> {
    return validateOperationsAgainstDocument({
      document: input.document,
      operations: this.hydrateOperations(input.operations),
      schemas: this.schemas,
      catalogByType: this.catalogByType,
    });
  }
}

export function createRegistryAdapter(
  options: RegistryAdapterOptions,
): RegistryBuilderAIAdapter {
  return new RegistryBuilderAIAdapter(options);
}
