import type {
  GenerateChunk,
  GenerateInput,
  GenerateResult,
  ProviderCapabilities,
} from "../types";
import type { AIProvider } from "./types";

export type MockProviderHandler = (
  input: GenerateInput & { model: string },
) =>
  | Promise<Partial<GenerateResult> & { text: string }>
  | (Partial<GenerateResult> & { text: string });

export class MockAIProvider implements AIProvider {
  readonly id = "mock";
  private handler: MockProviderHandler;

  constructor(handler?: MockProviderHandler) {
    this.handler =
      handler ??
      (async () => ({
        text: "Mock response",
        toolCalls: [],
      }));
  }

  setHandler(handler: MockProviderHandler) {
    this.handler = handler;
  }

  getCapabilities(): ProviderCapabilities {
    return {
      textGeneration: true,
      toolCalling: true,
      structuredOutput: true,
      vision: false,
      streaming: true,
      imageGeneration: false,
      maxContextTokens: 128000,
      maxOutputTokens: 8192,
    };
  }

  async generate(
    input: GenerateInput & { model: string },
  ): Promise<GenerateResult> {
    const started = Date.now();
    const result = await this.handler(input);

    return {
      text: result.text,
      toolCalls: result.toolCalls ?? [],
      usage: result.usage ?? {
        inputTokens: 10,
        outputTokens: 20,
        totalTokens: 30,
      },
      finishReason: result.finishReason ?? "stop",
      model: result.model ?? input.model,
      provider: this.id,
      durationMs: Date.now() - started,
    };
  }

  async *stream(
    input: GenerateInput & { model: string },
  ): AsyncIterable<GenerateChunk> {
    const result = await this.generate(input);

    for (const char of result.text) {
      yield { type: "text-delta", textDelta: char };
    }

    for (const toolCall of result.toolCalls) {
      yield { type: "tool-call", toolCall };
    }

    yield { type: "finish", result };
  }
}
