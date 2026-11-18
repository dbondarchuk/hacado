import { getOrganizationIdAndSlug } from "@/app/utils";
import {
  checkRateLimit,
  getAIProvider,
  getModelsByTier,
  type AIMessage,
} from "@hacado/ai-core";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RATE_LIMIT = Number(process.env.AI_RATE_LIMIT ?? 30);
const RATE_WINDOW_MS = Number(process.env.AI_RATE_WINDOW_MS ?? 60_000);

type ChatMessage = {
  role?: string;
  content?: unknown;
};

function messageContentToString(content: unknown): string {
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: unknown }).text ?? "");
        }

        return "";
      })
      .join("");
  }

  if (content == null) return "";

  return String(content);
}

function toAIMessages(
  messages: ChatMessage[] | undefined,
  system?: string,
): AIMessage[] {
  const out: AIMessage[] = [];

  if (system?.trim()) {
    out.push({ role: "system", content: system.trim() });
  }

  for (const message of messages ?? []) {
    const role = message.role;
    if (role !== "system" && role !== "user" && role !== "assistant") {
      continue;
    }

    const content = messageContentToString(message.content).trim();
    if (!content) continue;

    out.push({ role, content });
  }

  return out;
}

/**
 * Encode AI SDK v3/v4 data-stream chunks for `ai/react` useChat in @hacado/rte
 * (ai@4). Do not use ai@7 UI message streams here.
 */
function encodeDataStreamTextDelta(text: string): Uint8Array {
  return new TextEncoder().encode(`0:${JSON.stringify(text)}\n`);
}

function encodeDataStreamFinish(usage: {
  promptTokens: number;
  completionTokens: number;
}): Uint8Array {
  return new TextEncoder().encode(
    `d:${JSON.stringify({
      finishReason: "stop",
      usage,
    })}\n`,
  );
}

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/ai/command")("POST");

  try {
    const { organizationId } = await getOrganizationIdAndSlug();
    const rate = checkRateLimit({
      key: `rte-ai:${organizationId}`,
      limit: RATE_LIMIT,
      windowMs: RATE_WINDOW_MS,
    });

    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded", resetAt: rate.resetAt },
        { status: 429 },
      );
    }

    const body = (await request.json()) as {
      messages?: ChatMessage[];
      system?: string;
      /** Ignored. Model is chosen server-side. */
      model?: string;
      /** Ignored. Never accept client API keys. */
      apiKey?: string;
    };

    const messages = toAIMessages(body.messages, body.system);

    if (!messages.some((message) => message.role === "user")) {
      return NextResponse.json(
        { error: "At least one user message is required" },
        { status: 400 },
      );
    }

    const model =
      process.env.AI_RTE_MODEL?.trim() ||
      getModelsByTier("economy")[0]?.id ||
      "openai/gpt-6-luna";

    const provider = getAIProvider();
    if (!provider.stream) {
      return NextResponse.json(
        { error: "AI streaming is not available" },
        { status: 503 },
      );
    }

    const streamText = provider.stream.bind(provider);
    const abortSignal = request.signal;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let promptTokens = 0;
        let completionTokens = 0;

        try {
          for await (const chunk of streamText({
            task: "copywriting",
            model,
            messages,
            temperature: 0.4,
            maxOutputTokens: 2048,
            abortSignal,
            promptCacheKey: `rte-ai:${organizationId}`,
          })) {
            if (chunk.type === "text-delta" && chunk.textDelta) {
              controller.enqueue(encodeDataStreamTextDelta(chunk.textDelta));
            }

            if (chunk.type === "finish") {
              promptTokens = chunk.result.usage.inputTokens ?? 0;
              completionTokens = chunk.result.usage.outputTokens ?? 0;
            }

            if (chunk.type === "error") {
              logger.error(
                { err: chunk.error, organizationId },
                "rte ai stream error",
              );

              controller.error(
                new Error(chunk.error.message || "AI request failed"),
              );

              return;
            }
          }

          controller.enqueue(
            encodeDataStreamFinish({
              promptTokens,
              completionTokens,
            }),
          );

          controller.close();
        } catch (error) {
          if (
            (error instanceof DOMException && error.name === "AbortError") ||
            (error instanceof Error && error.name === "AbortError")
          ) {
            controller.close();
            return;
          }

          logger.error({ err: error, organizationId }, "rte ai command failed");
          controller.error(
            error instanceof Error ? error : new Error("AI request failed"),
          );
        }
      },
    });

    return new Response(stream, {
      headers: {
        Connection: "keep-alive",
        "Content-Type": "text/plain; charset=utf-8",
        "X-Vercel-AI-Data-Stream": "v1",
      },
    });
  } catch (error) {
    logger.error({ err: error }, "rte ai command request failed");

    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
