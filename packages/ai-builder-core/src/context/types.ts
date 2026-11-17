import type { BusinessContextSlice } from "@hacado/ai-core";
import type {
  BuilderDocumentSettings,
  BuilderKind,
  DocumentStructureNode,
  SelectionContextPayload,
} from "../types";
import type { TemplateArgsSummary } from "./args-summary";

export type {
  BusinessContextNeed,
  BusinessContextRaw,
  BusinessContextSlice,
} from "@hacado/ai-core";

export type AssembledAIContext = {
  builder: {
    kind: BuilderKind;
    blockCount: number;
  };
  document?: {
    revision: string;
    structure: DocumentStructureNode[];
    rootType: string;
  };
  selection?: SelectionContextPayload & {
    blocks?: Array<{ id: string; type: string; data: unknown }>;
    ancestors?: DocumentStructureNode[];
  };
  business?: BusinessContextSlice;
  /** Preview/template args available for Mustache variables (esp. email). */
  templateArgs?: TemplateArgsSummary;
  /** Host-form settings outside the block tree (page SEO, email subject, …). */
  documentSettings?: BuilderDocumentSettings;
  task: {
    instruction: string;
    actionId?: string;
  };
};
