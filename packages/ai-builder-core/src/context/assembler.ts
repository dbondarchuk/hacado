import type { BusinessContextSlice } from "@hacado/ai-core";
import type { TEditorBlock } from "@hacado/builder/editor";
import type { BuilderAIAdapter } from "../adapters/types";
import { computeDocumentRevision } from "../operations/revision";
import type {
  BuilderDocumentSettings,
  SelectionContextPayload,
} from "../types";
import { summarizeTemplateArgs } from "./args-summary";
import type { AssembledAIContext } from "./types";

export { selectBusinessSlice } from "@hacado/ai-core";

export type AssembleContextInput = {
  adapter: BuilderAIAdapter;
  document: TEditorBlock;
  selection: SelectionContextPayload;
  instruction: string;
  actionId?: string;
  business?: BusinessContextSlice;
  args?: Record<string, unknown>;
  documentSettings?: BuilderDocumentSettings;
  includeFullStructure?: boolean;
};

export async function assembleAIContext(
  input: AssembleContextInput,
): Promise<AssembledAIContext> {
  const builderContext = await input.adapter.getBuilderContext();
  const revision = computeDocumentRevision(input.document);
  const includeStructure =
    input.includeFullStructure ||
    input.selection.selectionType === "document" ||
    input.selection.selectedBlockIds.length === 0;

  const structure = includeStructure
    ? input.adapter.getDocumentStructure(input.document)
    : input.adapter
        .getDocumentStructure(input.document)
        .filter(
          (node) =>
            input.selection.selectedBlockIds.includes(node.id) ||
            node.depth <= 1,
        );

  const selectionDetails = input.adapter.getSelectionContext(
    input.document,
    input.selection,
  );

  return {
    builder: {
      kind: builderContext.builder,
      blockCount: builderContext.blockCount,
    },
    document: {
      revision,
      structure,
      rootType: input.document.type,
    },
    selection: {
      ...input.selection,
      documentRevision: revision,
      blocks: selectionDetails.blocks,
      ancestors: selectionDetails.ancestors,
    },
    business: input.business,
    templateArgs: summarizeTemplateArgs(input.args),
    documentSettings: input.documentSettings,
    task: {
      instruction: input.instruction,
      actionId: input.actionId,
    },
  };
}
