import type { EditorHistoryEntry, TEditorBlock } from "@hacado/builder/editor";
import type { BlockFilterRule, BuilderSchema } from "@hacado/builder/types";
import type * as z from "zod";
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

export type BlockCatalogEntry = {
  type: string;
  displayName: string;
  category: string;
  tags?: string[];
  capabilities?: string[];
  allowedIn?: BlockFilterRule;
  allowedBuilderTypes?: string[];
  hideInBlocksPanel?: boolean;
  providerName?: string;
  schema: z.ZodTypeAny;
  defaultValue?: unknown;
  description?: string;
};

export type StyleCatalogEntry = {
  name: string;
  category?: string;
  description?: string;
  responsive?: boolean;
  schema?: unknown;
};

export interface BuilderAIAdapter {
  readonly builder: BuilderKind;

  getBuilderContext(): Promise<{
    builder: BuilderKind;
    blockCount: number;
    stylePropertyCount: number;
  }>;

  searchBlocks(input: {
    query: string;
    category?: string;
    limit?: number;
  }): Promise<BlockSearchHit[]>;

  getBlockSchemas(input: {
    blockTypes: string[];
  }): Promise<BlockSchemaResult[]>;

  getBlockRelationships(input: {
    blockTypes: string[];
  }): Promise<BlockRelationship[]>;

  searchStyleProperties(input: {
    query: string;
    blockType?: string;
    limit?: number;
  }): Promise<StylePropertyHit[]>;

  getStyleSchema(input: {
    properties: string[];
    blockType?: string;
  }): Promise<StyleSchemaResult[]>;

  getDesignTokens(input?: { categories?: string[] }): Promise<DesignTokenHit[]>;

  getDocumentStructure(document: TEditorBlock): DocumentStructureNode[];

  getSelectionContext(
    document: TEditorBlock,
    selection: SelectionContextPayload,
  ): {
    blocks: Array<{ id: string; type: string; data: unknown }>;
    ancestors: DocumentStructureNode[];
  };

  getBlocksByIds(
    document: TEditorBlock,
    blockIds: string[],
  ): Array<{ id: string; type: string; data: unknown; found: boolean }>;

  /**
   * Deep-clone a block subtree with fresh ids, ready for add-block as a sibling.
   */
  cloneBlockForInsert(
    document: TEditorBlock,
    blockId: string,
  ): {
    found: boolean;
    sourceBlockId: string;
    parentBlockId: string | null;
    index: number | null;
    block?: TEditorBlock;
  };

  getBlockAICapabilities(input: {
    blockType: string;
  }): Promise<BlockAICapability[]>;

  getSchemas(): BuilderSchema;

  validateOperations(input: {
    document: TEditorBlock;
    operations: EditorHistoryEntry[];
  }): Promise<ValidationResult>;
}
