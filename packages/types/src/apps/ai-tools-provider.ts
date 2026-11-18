import type { AllKeys } from "@hacado/i18n";
import type { ConnectedAppData } from "./connected-app.data";

/** Host UI progress metadata — not sent to the model. */
export type AppAIToolUiMeta = {
  label: string;
  /** Full i18n key for unnamespaced `useI18n()` (e.g. `app_blog_admin.ai.tools.loadingExistingPosts`). */
  labelKey?: AllKeys;
};

/** Tool definition shape for connected-app AI tools (matches ai-core AIToolDefinition). */
export type AppAIToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  ui?: AppAIToolUiMeta;
};

/**
 * Implemented by connected apps that declare the `ai-tools-provider` scope.
 * Session discovery prefixes tools as `app_{connectedAppId}__{name}`
 * (underscores only — provider tool names disallow dots).
 */
export interface IAIToolsProvider {
  listAITools(appData: ConnectedAppData): Promise<AppAIToolDefinition[]>;

  executeAITool(
    appData: ConnectedAppData,
    name: string,
    args: Record<string, unknown>,
  ): Promise<unknown>;
}
