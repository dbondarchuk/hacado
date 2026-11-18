import { createGateway } from "@ai-sdk/gateway";
import { getLoggerFactory } from "@hacado/logger";
import { generateText, jsonSchema, streamText, tool } from "ai";
import type {
  GenerateChunk,
  GenerateInput,
  GenerateResult,
  ProviderCapabilities,
} from "../types";
import { BuilderAIError, normalizeProviderError } from "./errors";
import { splitInstructionsAndMessages } from "./messages";
import { summarizeGenerateRequest } from "./request-log";
import type { AIProvider } from "./types";
import { toUsage } from "./usage";

function toAiTools(tools: GenerateInput["tools"]) {
  if (!tools?.length) return undefined;

  return Object.fromEntries(
    tools.map((definition) => [
      definition.name,
      tool({
        description: definition.description,
        inputSchema: jsonSchema(definition.inputSchema),
      }),
    ]),
  );
}

function createClient() {
  return createGateway({
    apiKey: process.env.AI_GATEWAY_API_KEY,
  });
}

function buildGatewayProviderOptions(promptCacheKey?: string) {
  return {
    gateway: {
      caching: "auto" as const,
    },
    ...(promptCacheKey ? { openai: { promptCacheKey } } : {}),
  };
}

/**
 * Vercel AI Gateway provider. App does not need to be hosted on Vercel -
 * only an AI Gateway API key (and a Vercel account for billing) is required.
 * Model ids use `provider/model` form, e.g. `openai/gpt-6-luna`.
 */
export class GatewayAIProvider implements AIProvider {
  readonly id = "gateway";
  private readonly loggerFactory = getLoggerFactory("GatewayAIProvider");

  getCapabilities(): ProviderCapabilities {
    return {
      textGeneration: true,
      toolCalling: true,
      structuredOutput: true,
      vision: true,
      streaming: true,
      imageGeneration: false,
      maxContextTokens: 1050000,
      maxOutputTokens: 128000,
    };
  }

  async generate(
    input: GenerateInput & { model: string },
  ): Promise<GenerateResult> {
    const logger = this.loggerFactory("generate");
    const started = Date.now();
    const summary = summarizeGenerateRequest(input);
    const gateway = createClient();
    const { instructions, messages } = splitInstructionsAndMessages(
      input.messages,
    );

    logger.debug(summary, "Starting generate");

    try {
      const result = await generateText({
        model: gateway(input.model),
        instructions,
        messages,
        tools: toAiTools(input.tools),
        temperature: input.temperature,
        maxOutputTokens: input.maxOutputTokens,
        abortSignal: input.abortSignal,
        providerOptions: buildGatewayProviderOptions(input.promptCacheKey),
      });

      const durationMs = Date.now() - started;
      const toolCalls = (result.toolCalls ?? []).map((call) => ({
        id: call.toolCallId,
        name: call.toolName,
        arguments: (call.input ?? {}) as Record<string, unknown>,
      }));

      logger.debug(
        {
          ...summary,
          durationMs,
          finishReason: String(result.finishReason ?? "stop"),
          usage: toUsage(result.usage ?? {}),
          textChars: result.text?.length ?? 0,
          toolCallNames: toolCalls.map((call) => call.name),
        },
        "Generate completed",
      );

      return {
        text: result.text,
        toolCalls,
        usage: toUsage(result.usage ?? {}),
        finishReason: String(result.finishReason ?? "stop"),
        model: input.model,
        provider: this.id,
        durationMs,
      };
    } catch (error) {
      const normalized = normalizeProviderError(error, this.id);
      logger.error(
        {
          err: error,
          ...summary,
          durationMs: Date.now() - started,
          code: normalized.code,
          retryable: normalized.retryable,
        },
        "Generate failed",
      );

      throw new BuilderAIError(normalized);
    }
  }

  async *stream(
    input: GenerateInput & { model: string },
  ): AsyncIterable<GenerateChunk> {
    const logger = this.loggerFactory("stream");
    const started = Date.now();
    const summary = summarizeGenerateRequest(input);
    const gateway = createClient();
    const { instructions, messages } = splitInstructionsAndMessages(
      input.messages,
    );

    logger.debug(summary, "Starting stream");

    try {
      const result = streamText({
        model: gateway(input.model),
        instructions,
        messages,
        tools: toAiTools(input.tools),
        temperature: input.temperature,
        maxOutputTokens: input.maxOutputTokens,
        abortSignal: input.abortSignal,
        providerOptions: buildGatewayProviderOptions(input.promptCacheKey),
      });

      let textDeltaCount = 0;
      let toolCallCount = 0;

      for await (const part of result.stream) {
        if (part.type === "text-delta") {
          textDeltaCount += 1;
          yield {
            type: "text-delta",
            textDelta: "text" in part ? String(part.text) : "",
          };
        } else if (part.type === "tool-call") {
          toolCallCount += 1;
          logger.debug(
            { toolName: part.toolName, toolCallId: part.toolCallId },
            "Stream tool call",
          );

          yield {
            type: "tool-call",
            toolCall: {
              id: part.toolCallId,
              name: part.toolName,
              arguments: (part.input ?? {}) as Record<string, unknown>,
            },
          };
        }
      }

      const [text, usage, finishReason, toolCalls] = await Promise.all([
        result.text,
        result.usage,
        result.finishReason,
        result.toolCalls,
      ]);

      const durationMs = Date.now() - started;
      logger.debug(
        {
          ...summary,
          durationMs,
          finishReason: String(finishReason ?? "stop"),
          usage: toUsage(usage ?? {}),
          textChars: text?.length ?? 0,
          textDeltaCount,
          toolCallCount,
          toolCallNames: (toolCalls ?? []).map((call) => call.toolName),
        },
        "Stream completed",
      );

      yield {
        type: "finish",
        result: {
          text,
          toolCalls: (toolCalls ?? []).map((call) => ({
            id: call.toolCallId,
            name: call.toolName,
            arguments: (call.input ?? {}) as Record<string, unknown>,
          })),
          usage: toUsage(usage ?? {}),
          finishReason: String(finishReason ?? "stop"),
          model: input.model,
          provider: this.id,
          durationMs,
        },
      };
    } catch (error) {
      const normalized = normalizeProviderError(error, this.id);
      logger.error(
        {
          err: error,
          ...summary,
          durationMs: Date.now() - started,
          code: normalized.code,
          retryable: normalized.retryable,
          aborted: Boolean(input.abortSignal?.aborted),
        },
        "Stream failed",
      );

      yield {
        type: "error",
        error: normalized,
      };
    }
  }
}
