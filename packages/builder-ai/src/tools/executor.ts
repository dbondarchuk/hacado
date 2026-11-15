import type { EditorHistoryEntry, TEditorBlock } from "@hacado/builder/editor";
import type { BuilderAIAdapter } from "../adapters/types";
import { selectBusinessSlice } from "../context/assembler";
import type {
  BusinessContextNeed,
  BusinessContextSlice,
} from "../context/types";
import {
  cloneBlockForInsert,
  getBlocksByIds,
} from "../discovery/document-structure";
import { normalizeEditorOperations } from "../operations/normalize";
import { computeDocumentRevision } from "../operations/revision";
import { buildDocumentSettingsProposal } from "../operations/settings";
import type {
  DocumentProposal,
  DocumentSettingsProposal,
  SelectionContextPayload,
  ValidationResult,
} from "../types";

export type ToolExecutorDeps = {
  adapter: BuilderAIAdapter;
  document: TEditorBlock;
  selection: SelectionContextPayload;
  businessRaw?: {
    general?: Record<string, unknown> | null;
    brand?: Record<string, unknown> | null;
    social?: Record<string, unknown> | null;
    styling?: Record<string, unknown> | null;
    services?: BusinessContextSlice["services"];
    addons?: BusinessContextSlice["addons"];
    packages?: BusinessContextSlice["packages"];
    members?: BusinessContextSlice["members"];
  };
  onProposal?: (proposal: DocumentProposal) => void;
  onSettingsProposal?: (proposal: DocumentSettingsProposal) => void;
};

export async function executeBuilderAITool(
  name: string,
  args: Record<string, unknown>,
  deps: ToolExecutorDeps,
): Promise<unknown> {
  try {
    return await executeBuilderAIToolInner(name, args, deps);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : `Tool "${name}" failed: ${String(error)}`,
    };
  }
}

async function executeBuilderAIToolInner(
  name: string,
  args: Record<string, unknown>,
  deps: ToolExecutorDeps,
): Promise<unknown> {
  switch (name) {
    case "searchBlocks":
      return deps.adapter.searchBlocks({
        query: String(args.query ?? ""),
        category: args.category ? String(args.category) : undefined,
        limit: typeof args.limit === "number" ? args.limit : undefined,
      });
    case "getBlockSchemas":
      return deps.adapter.getBlockSchemas({
        blockTypes: Array.isArray(args.blockTypes)
          ? args.blockTypes.map(String)
          : [],
      });
    case "getBlockRelationships":
      return deps.adapter.getBlockRelationships({
        blockTypes: Array.isArray(args.blockTypes)
          ? args.blockTypes.map(String)
          : [],
      });
    case "searchStyleProperties":
      return deps.adapter.searchStyleProperties({
        query: String(args.query ?? ""),
        blockType: args.blockType ? String(args.blockType) : undefined,
        limit: typeof args.limit === "number" ? args.limit : undefined,
      });
    case "getStyleSchema":
      return deps.adapter.getStyleSchema({
        properties: Array.isArray(args.properties)
          ? args.properties.map(String)
          : [],
        blockType: args.blockType ? String(args.blockType) : undefined,
      });
    case "getDesignTokens":
      return deps.adapter.getDesignTokens({
        categories: Array.isArray(args.categories)
          ? args.categories.map(String)
          : undefined,
      });
    case "getDocumentStructure":
      return deps.adapter.getDocumentStructure(deps.document);
    case "getSelectedBlocks":
      return deps.adapter.getSelectionContext(deps.document, deps.selection);
    case "getBlocksByIds": {
      const blockIds = Array.isArray(args.blockIds)
        ? args.blockIds.map(String)
        : [];

      if (typeof deps.adapter.getBlocksByIds === "function") {
        return deps.adapter.getBlocksByIds(deps.document, blockIds);
      }

      return getBlocksByIds(deps.document, blockIds);
    }
    case "cloneBlockForInsert": {
      if (typeof deps.adapter.cloneBlockForInsert === "function") {
        return deps.adapter.cloneBlockForInsert(
          deps.document,
          String(args.blockId ?? ""),
        );
      }

      return cloneBlockForInsert(deps.document, String(args.blockId ?? ""));
    }
    case "getBusinessProfile": {
      const needs = Array.isArray(args.needs)
        ? (args.needs as BusinessContextNeed[])
        : (["profile", "branding"] satisfies BusinessContextNeed[]);

      return selectBusinessSlice(deps.businessRaw ?? {}, [...needs]);
    }
    case "getBlockAICapabilities":
      return deps.adapter.getBlockAICapabilities({
        blockType: String(args.blockType ?? ""),
      });
    case "validateOperations": {
      const normalized = normalizeEditorOperations(
        Array.isArray(args.operations) ? args.operations : [],
      );

      if (normalized.issues.length) {
        return {
          valid: false,
          issues: normalized.issues.map((message) => ({
            path: "operations",
            message,
          })),
          operations: normalized.operations,
        } satisfies ValidationResult & { operations: EditorHistoryEntry[] };
      }

      const validation = await deps.adapter.validateOperations({
        document: deps.document,
        operations: normalized.operations,
      });

      return { ...validation, operations: normalized.operations };
    }
    case "proposeDocumentOperations": {
      const normalized = normalizeEditorOperations(
        Array.isArray(args.operations) ? args.operations : [],
      );

      const normalizationIssues = normalized.issues.map((message) => ({
        path: "operations",
        message,
      }));

      let validation: ValidationResult;

      if (!normalized.operations.length) {
        validation = {
          valid: false,
          issues: [
            {
              path: "operations",
              message: "operations must include at least one editor change",
            },
            ...normalizationIssues,
          ],
        };
      } else if (normalizationIssues.length) {
        validation = { valid: false, issues: normalizationIssues };
      } else {
        validation = await deps.adapter.validateOperations({
          document: deps.document,
          operations: normalized.operations,
        });
      }

      const proposal: DocumentProposal = {
        documentRevision: computeDocumentRevision(deps.document),
        operations: normalized.operations,
        summary: String(args.summary ?? "Proposed changes"),
        warnings: validation.valid
          ? undefined
          : validation.issues.map((issue) =>
              issue.path ? `${issue.path}: ${issue.message}` : issue.message,
            ),
      };

      // Always surface the attempt so the orchestrator can correct failures.
      deps.onProposal?.(proposal);

      return { validation, proposal };
    }
    case "proposeDocumentSettings": {
      const result = buildDocumentSettingsProposal({
        builder: deps.adapter.builder,
        summary: String(args.summary ?? "Update document settings"),
        settings: args.settings,
      });

      deps.onSettingsProposal?.(result.proposal);

      return result;
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
