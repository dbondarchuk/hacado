/**
 * Browser-safe exports for applying proposals and building selection context.
 * Do not import server provider/orchestrator modules from client components.
 */
export { applyDocumentProposal } from "./operations/apply";
export {
  assertDocumentRevision,
  computeDocumentRevision,
} from "./operations/revision";

export type {
  AIMessage,
  BlockAICapability,
  BuilderAIRequest,
  BuilderAIResponse,
  BuilderDocumentSettings,
  BuilderKind,
  DocumentProposal,
  DocumentSettingsProposal,
  SelectionContextPayload,
} from "./types";
