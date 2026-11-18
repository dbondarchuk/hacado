import type { GenerateInput } from "../types";

/** Compact request diagnostics for provider logs (no message bodies / secrets). */
export function summarizeGenerateRequest(
  input: GenerateInput & { model: string },
) {
  const tools = input.tools ?? [];
  const toolSchemaChars = tools.reduce(
    (sum, tool) => sum + JSON.stringify(tool.inputSchema ?? {}).length,
    0,
  );

  const messageChars = input.messages.reduce(
    (sum, message) => sum + (message.content?.length ?? 0),
    0,
  );

  return {
    model: input.model,
    task: input.task,
    messageCount: input.messages.length,
    messageChars,
    toolCount: tools.length,
    toolNames: tools.map((tool) => tool.name),
    toolSchemaChars,
    temperature: input.temperature,
    maxOutputTokens: input.maxOutputTokens,
    hasPromptCacheKey: Boolean(input.promptCacheKey),
    aborted: Boolean(input.abortSignal?.aborted),
    hasGatewayKey: Boolean(process.env.AI_GATEWAY_API_KEY),
    nodeEnv: process.env.NODE_ENV,
  };
}
