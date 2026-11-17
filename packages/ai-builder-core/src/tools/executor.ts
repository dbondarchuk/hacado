import type { ToolResultCache } from "@hacado/ai-core";
import { withToolCache } from "@hacado/ai-core";
import type {
  EditorHistoryEntry,
  TEditorBlock,
} from "@hacado/builder/editor-types";
import type { BuilderAIAdapter } from "../adapters/types";
import { summarizeTemplateArgs } from "../context/args-summary";
import { selectBusinessSlice } from "../context/assembler";
import type {
  BusinessContextNeed,
  BusinessContextSlice,
} from "../context/types";
import {
  buildDocumentSectionPatterns,
  buildDocumentStructure,
  cloneBlockForInsert,
  getBlocksByIds,
} from "../discovery/document-structure";
import { normalizeEditorOperations } from "../operations/normalize";
import { computeDocumentRevision } from "../operations/revision";
import { buildDocumentSettingsProposal } from "../operations/settings";
import { buildCatalogSummary } from "../orchestration/catalog-context";
import type {
  BuilderDocumentSettings,
  DocumentProposal,
  DocumentSettingsProposal,
  SelectionContextPayload,
  ValidationResult,
} from "../types";
import { parseAskUserArgs } from "./ask-user";

export type ToolExecutorDeps = {
  adapter: BuilderAIAdapter;
  document: TEditorBlock;
  selection: SelectionContextPayload;
  organizationId?: string;
  documentSettings?: BuilderDocumentSettings;
  /** Available page headers/footers for proposeDocumentSettings. */
  documentChrome?: {
    availableHeaders?: Array<{ id: string; name: string; usedCount?: number }>;
    availableFooters?: Array<{ id: string; name: string; usedCount?: number }>;
  };
  templateArgs?: Record<string, unknown>;
  cache?: ToolResultCache;
  searchDesignPatterns?: (input: {
    query: string;
    limit?: number;
  }) => Promise<unknown> | unknown;
  searchStockImages?: (input: {
    query: string;
    count?: number;
  }) => Promise<unknown> | unknown;
  searchStockVideos?: (input: {
    query: string;
    count?: number;
  }) => Promise<unknown> | unknown;
  searchPages?: (input: {
    query?: string;
    limit?: number;
    publishedOnly?: boolean;
  }) => Promise<unknown> | unknown;
  connectedApps?: Array<{
    appId: string;
    appName: string;
    metadataKey?: string;
    blockTypesHint?: string[];
  }>;
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
          ...(deps.documentChrome ?? {}),
          hint:
            deps.adapter.builder === "page"
              ? 'On create/design/redesign: proposeDocumentSettings with title, slug, description, keywords; set headerId/footerId from availableHeaders/availableFooters when choosing a chrome. Title is page-only (no "| Brand" suffix - host adds brand automatically). Slug should match that short title.'
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
    case "searchStockImages": {
      const count =
        typeof args.count === "number"
          ? Math.min(12, Math.max(1, Math.floor(args.count)))
          : 6;

      if (deps.searchStockImages) {
        return deps.searchStockImages({
          query: String(args.query ?? ""),
          count,
        });
      }

      return {
        available: false,
        providers: [],
        items: [],
        hint: "Stock image search is not configured. Leave Image src as schema defaults/placeholders; do not invent Unsplash or Pexels URLs.",
      };
    }
    case "searchStockVideos": {
      const count =
        typeof args.count === "number"
          ? Math.min(12, Math.max(1, Math.floor(args.count)))
          : 6;

      if (deps.searchStockVideos) {
        return deps.searchStockVideos({
          query: String(args.query ?? ""),
          count,
        });
      }

      return {
        available: false,
        providers: [],
        items: [],
        hint: "Stock video search is not configured. Leave Video src as schema defaults/placeholders; do not invent Pexels URLs.",
      };
    }
    case "searchPages": {
      if (deps.searchPages) {
        return deps.searchPages({
          query: typeof args.query === "string" ? args.query : undefined,
          limit: typeof args.limit === "number" ? args.limit : 20,
          publishedOnly:
            typeof args.publishedOnly === "boolean" ? args.publishedOnly : true,
        });
      }

      return {
        available: false,
        items: [],
        hint: "Page search is not available. Prefer /book for booking CTAs; do not invent page slugs.",
      };
    }
    case "getConnectedApps": {
      const apps = deps.connectedApps ?? [];

      return {
        apps,
        hint: apps.length
          ? "When adding app-powered blocks, set block.metadata[metadataKey] to appId (or use set-block-metadata). Prefer Modern booking/modify variants."
          : "No connected builder apps.",
      };
    }
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

      const org = deps.organizationId ?? "anon";
      const needsKey = [...needs].sort().join(",");

      return withToolCache({
        cache: deps.cache,
        key: `builder-ai:business:${org}:${needsKey}`,
        compute: () => {
          const wantsSummary = needs.includes("summary");
          const sliceNeeds = needs.filter(
            (need): need is Exclude<BusinessContextNeed, "summary"> =>
              need !== "summary",
          );

          const slice = selectBusinessSlice(
            deps.businessRaw ?? {},
            sliceNeeds.length
              ? sliceNeeds
              : wantsSummary
                ? ["members", "services", "addons", "packages", "profile"]
                : ["profile", "branding"],
          );

          if (!wantsSummary) return slice;

          const forSummary = selectBusinessSlice(deps.businessRaw ?? {}, [
            "members",
            "services",
            "addons",
            "packages",
            "profile",
          ]);

          return {
            ...slice,
            catalogSummary: buildCatalogSummary(forSummary),
          };
        },
      });
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
