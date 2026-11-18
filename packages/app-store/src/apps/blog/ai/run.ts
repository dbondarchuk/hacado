import {
  getAIProvider,
  resolveModelForTask,
  type AIMessage,
  type AIToolCall,
} from "@hacado/ai-core";
import { createAIToolsSession, resolveToolUi } from "@hacado/ai-tools";
import { getLoggerFactory } from "@hacado/logger";
import type { AskUserRequest } from "@hacado/types/ai";
import type { ConnectedAppData } from "@hacado/types/apps";
import type { IServicesContainer } from "@hacado/types/services";
import {
  BLOG_AI_SSE_ASK_USER,
  BLOG_AI_SSE_DELTA,
  BLOG_AI_SSE_PROGRESS,
} from "./events";
import {
  buildBlogAiSystemPrompt,
  buildBlogAiUserPrompt,
  type BlogAiDraftContext,
} from "./prompts";
import type { BlogAiProposal } from "./schema";
import { parseBlogAiProposalText } from "./schema";

const MAX_TOOL_ITERATIONS = 8;

export type BlogAiRunResult =
  | { status: "completed"; proposal: BlogAiProposal }
  | { status: "waiting_for_user"; askUser: AskUserRequest; text?: string };

function isAskUserResult(
  result: unknown,
): result is { askUser: AskUserRequest } {
  return Boolean(
    result &&
      typeof result === "object" &&
      "askUser" in result &&
      (result as { askUser?: unknown }).askUser,
  );
}

function looksLikeJsonPayload(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.startsWith("{") || trimmed.startsWith("```");
}

/** Prefer prose before a JSON object so mixed model turns still talk to the user. */
function extractNarrationText(text: string | undefined): string | undefined {
  const trimmed = text?.trim();
  if (!trimmed) return undefined;
  if (!looksLikeJsonPayload(trimmed)) return trimmed;

  const fenceIdx = trimmed.search(/```(?:json)?/i);
  const braceIdx = trimmed.indexOf("{");
  const jsonStart =
    fenceIdx >= 0 && (braceIdx < 0 || fenceIdx < braceIdx)
      ? fenceIdx
      : braceIdx;

  if (jsonStart <= 0) return undefined;

  const leading = trimmed.slice(0, jsonStart).trim();
  return leading || undefined;
}

/** Emit short user-facing narration; never stream raw proposal JSON. */
function emitNarration(
  emit: (event: string, data: unknown) => void,
  text: string | undefined,
) {
  const narration = extractNarrationText(text);
  if (!narration) return;

  emit(BLOG_AI_SSE_DELTA, {
    text: narration.endsWith("\n") ? narration : `${narration}\n\n`,
  });
}

export async function runBlogAiGenerate(input: {
  appData: ConnectedAppData;
  services: IServicesContainer;
  actionId: string;
  instruction: string;
  draft: BlogAiDraftContext;
  postId?: string;
  signal: AbortSignal;
  emit: (event: string, data: unknown) => void;
}): Promise<BlogAiRunResult> {
  const logger = getLoggerFactory("blog-ai")("runBlogAiGenerate");
  const started = Date.now();

  logger.debug(
    {
      actionId: input.actionId,
      organizationId: input.appData.organizationId,
      appId: input.appData._id,
      postId: input.postId,
      instructionChars: input.instruction.length,
    },
    "Starting blog AI generate",
  );

  input.emit(BLOG_AI_SSE_PROGRESS, {
    phase: "preparing",
    label: "Preparing",
  });

  const session = await createAIToolsSession({
    consumer: "blog-ai",
    services: input.services,
    signal: input.signal,
  });

  const messages: AIMessage[] = [
    { role: "system", content: buildBlogAiSystemPrompt() },
    {
      role: "user",
      content: buildBlogAiUserPrompt({
        actionId: input.actionId,
        instruction: input.instruction,
        draft: input.draft,
      }),
    },
  ];

  const resolved = resolveModelForTask("copywriting");
  const provider = getAIProvider(resolved.provider);

  logger.debug(
    {
      model: resolved.model,
      provider: resolved.provider,
      toolCount: session.definitions.length,
    },
    "Blog AI model and tools ready",
  );

  input.emit(BLOG_AI_SSE_PROGRESS, {
    phase: "generating",
    label: "Generating",
  });

  let assistantText = "";

  try {
    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration += 1) {
      if (input.signal.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      const result = await provider.generate({
        task: "copywriting",
        model: resolved.model,
        temperature: 0.4,
        maxOutputTokens: 4096,
        promptCacheKey: `blog-ai:${input.appData.organizationId}`,
        messages,
        tools: session.definitions,
        abortSignal: input.signal,
      });

      assistantText = result.text || assistantText;
      emitNarration(input.emit, result.text);

      if (!result.toolCalls.length) {
        break;
      }

      messages.push({
        role: "assistant",
        content: result.text || "",
        toolCalls: result.toolCalls,
      });

      const askUserCall = result.toolCalls.find(
        (toolCall) => toolCall.name === "platform_askUser",
      );

      const ordered: AIToolCall[] = askUserCall
        ? [
            askUserCall,
            ...result.toolCalls.filter((toolCall) => toolCall !== askUserCall),
          ]
        : result.toolCalls;

      let pausedForAskUser = false;

      for (const toolCall of ordered) {
        if (pausedForAskUser) break;

        const toolUi = resolveToolUi(toolCall.name, session.definitions);

        input.emit(BLOG_AI_SSE_PROGRESS, {
          phase: "tool",
          tool: toolCall.name,
          label: toolUi.label,
          labelKey: toolUi.labelKey,
          stepPhase: "start",
        });

        let toolResult: unknown;
        try {
          toolResult = await session.execute(
            toolCall.name,
            toolCall.arguments ?? {},
          );
        } catch (error: any) {
          logger.warn(
            {
              err: error,
              tool: toolCall.name,
              actionId: input.actionId,
            },
            "Blog AI tool execution failed",
          );

          toolResult = {
            error: error?.message || String(error),
          };
        }

        input.emit(BLOG_AI_SSE_PROGRESS, {
          phase: "tool",
          tool: toolCall.name,
          label: toolUi.label,
          labelKey: toolUi.labelKey,
          stepPhase: "done",
        });

        if (
          toolCall.name === "platform_askUser" &&
          isAskUserResult(toolResult)
        ) {
          logger.debug(
            {
              actionId: input.actionId,
              durationMs: Date.now() - started,
            },
            "Blog AI paused for askUser",
          );

          input.emit(BLOG_AI_SSE_ASK_USER, toolResult.askUser);
          return {
            status: "waiting_for_user",
            askUser: toolResult.askUser,
            text: assistantText.trim() || toolResult.askUser.question,
          };
        }

        messages.push({
          role: "tool",
          content: JSON.stringify(toolResult),
          toolCallId: toolCall.id,
          name: toolCall.name,
        });

        if (toolCall.name === "platform_askUser") {
          pausedForAskUser = true;
        }
      }
    }

    input.emit(BLOG_AI_SSE_PROGRESS, {
      phase: "parsing",
      label: "Parsing",
    });

    const proposal = parseBlogAiProposalText(assistantText || "{}");

    // Past-tense wrap-up for the chat (not the article topic blurb alone).
    const summary = proposal.summary?.trim();
    if (summary) {
      emitNarration(input.emit, summary);
    }

    logger.debug(
      {
        actionId: input.actionId,
        durationMs: Date.now() - started,
        textChars: assistantText.length,
        hasSummary: Boolean(summary),
        hasBody: Boolean(proposal.contentMarkdown?.trim()),
      },
      "Blog AI generate completed",
    );

    return { status: "completed", proposal };
  } catch (error) {
    logger.error(
      {
        err: error,
        actionId: input.actionId,
        organizationId: input.appData.organizationId,
        model: resolved.model,
        provider: resolved.provider,
        durationMs: Date.now() - started,
        aborted: input.signal.aborted,
      },
      "Blog AI generate failed",
    );

    throw error;
  }
}
