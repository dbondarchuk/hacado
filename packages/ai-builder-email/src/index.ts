export { createEmailBuilderAIAdapter } from "./create-adapter";
export {
  EMAIL_QUALITY_NUDGE,
  emailNeedsQualityFix,
  looksLikeEmailBodyCreate,
  looksLikeSubjectOnlyAsk,
  proposalContainsMustache,
} from "./email-quality";
export { buildEmailMechanicsPrompt, buildEmailSystemPrompt } from "./prompts";
