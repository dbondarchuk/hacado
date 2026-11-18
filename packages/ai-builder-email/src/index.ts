export { createEmailBuilderAIAdapter } from "./create-adapter";
export {
  EMAIL_QUALITY_NUDGE,
  collectProposalBlockTypes,
  emailNeedsQualityFix,
  isPlainTextHeavyEmailProposal,
  looksLikeEmailBodyCreate,
  looksLikeSubjectOnlyAsk,
  proposalContainsMustache,
} from "./email-quality";

export { buildEmailMechanicsPrompt, buildEmailSystemPrompt } from "./prompts";
