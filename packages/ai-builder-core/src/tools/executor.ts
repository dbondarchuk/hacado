import type { ToolResultCache } from "@hacado/ai-core";
import { withToolCache } from "@hacado/ai-core";
import { parseAskUserArgs } from "@hacado/ai-tools";
import type {
  EditorHistoryEntry,
  TEditorBlock,
} from "@hacado/builder/editor-types";
import type { BuilderAIAdapter } from "../adapters/types";
import { summarizeTemplateArgs } from "../context/args-summary";
import {
  buildDocumentSectionPatterns,
  buildDocumentStructure,
  cloneBlockForInsert,
  getBlocksByIds,
} from "../discovery/document-structure";
import { normalizeEditorOperations } from "../operations/normalize";
import { computeDocumentRevision } from "../operations/revision";
import { buildDocumentSettingsProposal } from "../operations/settings";
import type {
  BuilderDocumentSettings,
  DocumentProposal,
  DocumentSettingsProposal,
  SelectionContextPayload,
  ValidationResult,
} from "../types";

export type ToolExecutorDeps = {
  adapter: BuilderAIAdapter;
  document: TEditorBlock;
  selection: SelectionContextPayload;
  organizationId?: string;
  documentSettings?: BuilderDocumentSettings;
  templateArgs?: Record<string, unknown>;
  cache?: ToolResultCache;
  searchDesignPatterns?: (input: {
    query: string;
    limit?: number;
  }) => Promise<unknown> | unknown;
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
    case "getDocumentStructure": {
      const revision = computeDocumentRevision(deps.document);
      const org = deps.organizationId ?? "anon";

      return withToolCache({
        cache: deps.cache,
        key: `builder-ai:doc-structure:${org}:${revision}`,
        compute: () => {
          const structure = deps.adapter.getDocumentStructure(deps.document);

          return {
            structure,
            sectionPatterns: buildDocumentSectionPatterns(structure),
          };
        },
      });
    }
    case "getSelectedBlocks":
      return deps.adapter.getSelectionContext(deps.document, deps.selection);
    case "getDocumentSettings":
      return withToolCache({
        cache: deps.cache,
        key: `builder-ai:doc-settings:${deps.organizationId ?? "anon"}:${computeDocumentRevision(deps.document)}`,
        compute: () => ({
          ...(deps.documentSettings ?? {}),
          hint:
            deps.adapter.builder === "page"
              ? 'On create/design/redesign: call platform_listPageChrome then proposeDocumentSettings with title, slug, description, keywords; set headerId/footerId from that list when choosing chrome. Title is page-only (no "| Brand" suffix - host adds brand automatically). Slug should match that short title.'
              : deps.adapter.builder === "email"
                ? "On create/design/redesign: proposeDocumentSettings with name and subject."
                : deps.adapter.builder === "text-message"
                  ? "On create/rewrite: proposeDocumentSettings with name (admin label) and value (Mustache SMS body). Prefer short clear copy; keep Mustache variables from getTemplateArgs."
                  : "On create/rename: proposeDocumentSettings with name.",
        }),
      });
    case "getTemplateArgs":
      return withToolCache({
        cache: deps.cache,
        key: `builder-ai:template-args:${deps.organizationId ?? "anon"}:${computeDocumentRevision(deps.document)}`,
        compute: () =>
          summarizeTemplateArgs(deps.templateArgs) ?? { paths: [] },
      });
    case "searchDesignPatterns": {
      if (deps.searchDesignPatterns) {
        return deps.searchDesignPatterns({
          query: String(args.query ?? ""),
          limit: typeof args.limit === "number" ? args.limit : 5,
        });
      }

      const structure = buildDocumentStructure(deps.document);
      const patterns = buildDocumentSectionPatterns(structure);
      const query = String(args.query ?? "").toLowerCase();
      const matched = patterns.filter(
        (pattern) =>
          pattern.signature.toLowerCase().includes(query) ||
          pattern.type.toLowerCase().includes(query) ||
          (pattern.summary ?? "").toLowerCase().includes(query),
      );

      return {
        patterns: (matched.length ? matched : patterns).slice(
          0,
          typeof args.limit === "number" ? args.limit : 5,
        ),
        hint: "Use cloneBlockForInsert on a matching section id to reuse real structure.",
      };
    }
    case "searchStockImages":
      return {
        available: false,
        providers: [],
        items: [],
        hint: "Stock image search requires platform_searchStockImages via services.",
      };
    case "searchStockVideos":
      return {
        available: false,
        providers: [],
        items: [],
        hint: "Stock video search requires platform_searchStockVideos via services.",
      };
    case "searchPages":
      return {
        available: false,
        items: [],
        hint: "Page search requires platform_searchPages via services. Prefer /book for booking CTAs; do not invent page slugs.",
      };
    case "getConnectedApps":
      return {
        apps: [],
        hint: "Connected apps require platform_listConnectedApps via services.",
      };
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
    case "getBusinessProfile":
      return {
        error:
          "Business profile requires platform_getBusinessProfile via services.",
      };
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

      const operations =
        typeof deps.adapter.hydrateOperations === "function"
          ? deps.adapter.hydrateOperations(normalized.operations)
          : normalized.operations;

      const normalizationIssues = normalized.issues.map((message) => ({
        path: "operations",
        message,
      }));

      let validation: ValidationResult;

      if (!operations.length) {
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
          operations,
        });
      }

      const proposal: DocumentProposal = {
        documentRevision: computeDocumentRevision(deps.document),
        operations,
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
    case "askUser": {
      const askUser = parseAskUserArgs(args);

      if (!askUser) {
        return {
          error:
            "askUser requires question, reason, required, and kind (clarification|confirmation|preference).",
        };
      }

      return { ok: true, askUser };
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
