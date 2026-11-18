import { getOrganizationIdAndSlug, getServicesContainer } from "@/app/utils";
import {
  assertDocumentRevision,
  BuilderAIError,
  checkRateLimit,
  loadBusinessContext,
  resolveContentLanguage,
  runBuilderAIOrchestrator,
  type BuilderAIRequest,
  type BuilderKind,
  type ToolResultCache,
} from "@hacado/ai-builder-core";
import {
  buildEmailSystemPrompt,
  createEmailBuilderAIAdapter,
  EMAIL_QUALITY_NUDGE,
  emailNeedsQualityFix,
} from "@hacado/ai-builder-email";
import {
  buildPageSystemPrompt,
  createPageBuilderAIAdapter,
  searchLiveDesignPatterns,
} from "@hacado/ai-builder-page";
import {
  buildTextMessageSystemPrompt,
  createTextMessageBuilderAIAdapter,
  TEXT_MESSAGE_QUALITY_NUDGE,
  textMessageNeedsQualityFix,
} from "@hacado/ai-builder-text-message";
import { getLoggerFactory } from "@hacado/logger";
import { getRedisClient } from "@hacado/services/bullmq";
import type { AIStreamEvent } from "@hacado/types/ai";
import { getTranslations } from "next-intl/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RATE_LIMIT = Number(process.env.AI_RATE_LIMIT ?? 30);
const RATE_WINDOW_MS = Number(process.env.AI_RATE_WINDOW_MS ?? 60_000);

function createRedisToolCache(): ToolResultCache {
  return {
    async get(key) {
      const redis = getRedisClient();
      await redis.connect().catch(() => undefined);

      return redis.get(key);
    },
    async set(key, value, ttlSeconds) {
      const redis = getRedisClient();
      await redis.connect().catch(() => undefined);
      await redis.set(key, value, "EX", ttlSeconds);
    },
  };
}

function encodeSse(event: string, data: unknown): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/builder-ai/chat")("POST");

  try {
    const { organizationId } = await getOrganizationIdAndSlug();
    const rate = checkRateLimit({
      key: `builder-ai:${organizationId}`,
      limit: RATE_LIMIT,
      windowMs: RATE_WINDOW_MS,
    });

    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded", resetAt: rate.resetAt },
        { status: 429 },
      );
    }

    const body = (await request.json()) as BuilderAIRequest & {
      apps?: Array<{ appId: string; appName: string }>;
    };

    if (!body?.builder || !body?.document || !body?.message) {
      return NextResponse.json(
        { error: "builder, document, and message are required" },
        { status: 400 },
      );
    }

    const builder = body.builder as BuilderKind;

    logger.debug(
      {
        organizationId,
        builder,
        documentId: body.documentId,
        conversationId: body.conversationId,
        actionId: body.actionId,
        messageChars: body.message.length,
        historyTurns: body.messages?.length ?? 0,
      },
      "builder-ai chat request",
    );

    const revisionCheck = assertDocumentRevision(
      body.document,
      body.documentRevision,
    );

    if (!revisionCheck.ok) {
      return NextResponse.json(
        {
          error: "stale_revision",
          actualRevision: revisionCheck.actual,
        },
        { status: 409 },
      );
    }

    const services = await getServicesContainer();
    const isTextMessage = builder === "text-message";
    const isEmail = builder === "email";
    const connectedApps =
      body.apps ??
      (isEmail || isTextMessage
        ? []
        : (
            await services.connectedAppsService.getAppsByScope("ui-components")
          ).map((app) => ({
            appId: String(app._id),
            appName: app.name,
          })));

    const adapter = isTextMessage
      ? createTextMessageBuilderAIAdapter()
      : isEmail
        ? createEmailBuilderAIAdapter()
        : createPageBuilderAIAdapter({
            builder,
            apps: connectedApps,
          });

    // Language only — business/catalog/apps/chrome are loaded via platform tools.
    const businessRaw = await loadBusinessContext(services);
    const brandLanguage =
      typeof businessRaw.brand?.language === "string"
        ? businessRaw.brand.language
        : null;

    const language = resolveContentLanguage({
      documentLanguage: body.documentSettings?.language,
      brandLanguage,
    });

    const t = await getTranslations("builder.ai");
    const systemPrompt = isTextMessage
      ? buildTextMessageSystemPrompt(language)
      : isEmail
        ? buildEmailSystemPrompt(language)
        : buildPageSystemPrompt(
            builder === "footer" ? "footer" : "page",
            language,
          );

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(encodeSse(event, data));
        };

        const onEvent = (event: AIStreamEvent) => {
          if (request.signal.aborted) return;

          if (event.type === "step") {
            send("step", event);
          } else if (event.type === "text-delta") {
            send("text-delta", { text: event.text });
          }
        };

        try {
          const response = await runBuilderAIOrchestrator(
            {
              builder,
              documentId: body.documentId,
              document: body.document,
              documentRevision: body.documentRevision,
              selection: body.selection,
              message: body.message,
              conversationId: body.conversationId,
              messages: body.messages,
              actionId: body.actionId,
              args: body.args,
              documentSettings: body.documentSettings,
            },
            {
              adapter,
              organizationId,
              language,
              systemPrompt,
              abortSignal: request.signal,
              onEvent,
              localizedStrings: {
                offTopicRefusal: t("responses.offTopic"),
                missingProposal: t("responses.missingProposal"),
              },
              services,
              cache: createRedisToolCache(),
              searchDesignPatterns:
                isEmail || isTextMessage
                  ? undefined
                  : ({ query, limit }) =>
                      searchLiveDesignPatterns({
                        document: body.document,
                        query,
                        limit,
                      }),
              qualityGate: isTextMessage
                ? {
                    needsFix: (input) =>
                      textMessageNeedsQualityFix({
                        ...input,
                        args: body.args,
                        language,
                      }),
                    nudge: TEXT_MESSAGE_QUALITY_NUDGE,
                  }
                : isEmail
                  ? {
                      needsFix: emailNeedsQualityFix,
                      nudge: EMAIL_QUALITY_NUDGE,
                    }
                  : undefined,
              maxToolIterations: 12,
              maxCorrections: 2,
            },
          );

          if (!request.signal.aborted) {
            send("result", response);
          }
        } catch (error) {
          if (isAbortError(error) || request.signal.aborted) {
            return;
          }

          logger.error(
            {
              err: error,
              builder,
              organizationId,
              documentId: body.documentId,
              conversationId: body.conversationId,
              actionId: body.actionId,
              code: error instanceof BuilderAIError ? error.code : undefined,
              retryable:
                error instanceof BuilderAIError ? error.retryable : undefined,
              aborted: request.signal.aborted,
            },
            "builder-ai chat failed",
          );

          if (error instanceof BuilderAIError) {
            send("error", { message: error.message, code: error.code });
          } else {
            send("error", { message: "Hacado AI request failed" });
          }
        } finally {
          controller.close();
        }
      },
      cancel() {
        // Client disconnect / Stop — AbortSignal on the request handles provider abort.
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    logger.error({ err: error }, "builder-ai chat failed");

    if (error instanceof BuilderAIError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.retryable ? 503 : 400 },
      );
    }

    return NextResponse.json(
      { error: "Hacado AI request failed" },
      { status: 500 },
    );
  }
}
