import {
  BuilderAIError,
  getAIProvider,
  resolveModelForTask,
  type AIMessage,
  type AIToolCall,
  type GenerateInput,
  type GenerateResult,
} from "@hacado/ai-core";
import { createAIToolsSession, resolveToolUi } from "@hacado/ai-tools";
import { getLoggerFactory } from "@hacado/logger";
import type { AskUserRequest } from "@hacado/types/ai";
import type { ConnectedAppData } from "@hacado/types/apps";
import type { IServicesContainer } from "@hacado/types/services";
import * as z from "zod";
import type { Design } from "../designer/lib/types";
import { resolveGiftCardContentLanguage } from "./brand-context";
import {
  GIFT_CARD_AI_SSE_ASK_USER,
  GIFT_CARD_AI_SSE_DELTA,
  GIFT_CARD_AI_SSE_PROGRESS,
} from "./events";
import {
  canvasSizeChanged,
  instructionApprovesCanvasResize,
  instructionDeclinesCanvasResize,
  withPreservedCanvasSize,
} from "./normalize-design";
import {
  buildGiftCardAiSystemPrompt,
  buildGiftCardAiUserPrompt,
  type GiftCardAiDesignContext,
} from "./prompts";
import type { GiftCardAiProposal } from "./schema";
import {
  formatGiftCardAiParseIssues,
  parseGiftCardAiProposalText,
} from "./schema";

const MAX_TOOL_ITERATIONS = 8;
const MODEL_RETRY_DELAY_MS = 400;

type GiftCardAiProvider = ReturnType<typeof getAIProvider>;
type GiftCardAiResolvedModel = ReturnType<typeof resolveModelForTask>;

/** One automatic retry for transient gateway/provider drops (same idea as Builder AI). */
async function generateWithRetry(input: {
  provider: GiftCardAiProvider;
  generateInput: GenerateInput & { model: string };
  logger: ReturnType<ReturnType<typeof getLoggerFactory>>;
  actionId: string;
}): Promise<GenerateResult> {
  try {
    return await input.provider.generate(input.generateInput);
  } catch (error) {
    if (
      !(error instanceof BuilderAIError) ||
      !error.retryable ||
      input.generateInput.abortSignal?.aborted
    ) {
      throw error;
    }

    input.logger.warn(
      {
        err: error,
        actionId: input.actionId,
        model: input.generateInput.model,
        code: error.code,
      },
      "Retryable gift card AI model turn failed; retrying once",
    );

    await new Promise((resolve) => setTimeout(resolve, MODEL_RETRY_DELAY_MS));

    if (input.generateInput.abortSignal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    return input.provider.generate(input.generateInput);
  }
}

export type GiftCardAiRunResult =
  | { status: "completed"; proposal: GiftCardAiProposal }
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

  emit(GIFT_CARD_AI_SSE_DELTA, {
    text: narration.endsWith("\n") ? narration : `${narration}\n\n`,
  });
}

function buildCanvasResizeAskUser(
  current: Design["canvas"],
  proposed: Design["canvas"],
): AskUserRequest {
  const currentLabel = `${current.width}×${current.height} (${current.aspectRatio})`;
  const proposedLabel = `${proposed.width}×${proposed.height} (${proposed.aspectRatio})`;

  return {
    question: `Change the canvas from ${currentLabel} to ${proposedLabel}?`,
    reason:
      "The proposed redesign uses a different canvas size or aspect ratio than the current design.",
    required: true,
    kind: "confirmation",
    options: [
      {
        label: `Use ${proposedLabel}`,
        value: `Yes, change canvas size to ${proposed.width}x${proposed.height} aspect ratio ${proposed.aspectRatio}`,
      },
      {
        label: `Keep ${currentLabel}`,
        value: `No, keep canvas size ${current.width}x${current.height} aspect ratio ${current.aspectRatio}`,
      },
    ],
  };
}

async function parseProposalWithRetry(input: {
  provider: GiftCardAiProvider;
  resolved: GiftCardAiResolvedModel;
  messages: AIMessage[];
  assistantText: string;
  fallbackCanvas: Design["canvas"];
  organizationId: string;
  signal: AbortSignal;
  emit: (event: string, data: unknown) => void;
  logger: ReturnType<ReturnType<typeof getLoggerFactory>>;
  actionId: string;
}): Promise<{ proposal: GiftCardAiProposal; assistantText: string }> {
  try {
    return {
      proposal: parseGiftCardAiProposalText(input.assistantText || "{}", {
        fallbackCanvas: input.fallbackCanvas,
      }),
      assistantText: input.assistantText,
    };
  } catch (error) {
    if (!(error instanceof z.ZodError) && !(error instanceof SyntaxError)) {
      throw error;
    }

    const issues = formatGiftCardAiParseIssues(error);

    input.logger.warn(
      { actionId: input.actionId, issues },
      "Gift card AI proposal parse failed; retrying once",
    );

    input.emit(GIFT_CARD_AI_SSE_PROGRESS, {
      phase: "repairing",
      label: "Fixing design",
    });

    input.messages.push({
      role: "assistant",
      content: input.assistantText || "",
    });

    input.messages.push({
      role: "user",
      content: [
        "Your previous JSON failed validation. Return corrected JSON only (no markdown fences).",
        "Fix every issue. Every element must include position:{x,y}, size:{width,height}, and styles.",
        "shapeType must be rectangle|circle|line. background.type must be color|gradient|image or omit background.",
        "canvas.aspectRatio is required (string).",
        "Include fieldKey amount and code (and to + expiresAt unless omitted) plus separate label text elements for each field.",
        "Validation issues:",
        issues,
      ].join("\n"),
    });

    const repaired = await generateWithRetry({
      provider: input.provider,
      logger: input.logger,
      actionId: input.actionId,
      generateInput: {
        task: "document_generation",
        model: input.resolved.model,
        temperature: 0.2,
        maxOutputTokens: 16384,
        promptCacheKey: `gift-card-ai:${input.organizationId}`,
        messages: input.messages,
        abortSignal: input.signal,
      },
    });

    const assistantText = repaired.text || input.assistantText;

    return {
      proposal: parseGiftCardAiProposalText(assistantText || "{}", {
        fallbackCanvas: input.fallbackCanvas,
      }),
      assistantText,
    };
  }
}

export async function runGiftCardAiGenerate(input: {
  appData: ConnectedAppData;
  services: IServicesContainer;
  actionId: string;
  instruction: string;
  context: GiftCardAiDesignContext;
  designId?: string;
  signal: AbortSignal;
  emit: (event: string, data: unknown) => void;
}): Promise<GiftCardAiRunResult> {
  const logger = getLoggerFactory("gift-card-ai")("runGiftCardAiGenerate");
  const started = Date.now();
  const isBlankCanvas = input.context.design.elements.length === 0;
  const needsDesignName =
    input.context.needsDesignName ??
    (isBlankCanvas || !input.context.currentName?.trim());

  const allowCanvasResize =
    isBlankCanvas || instructionApprovesCanvasResize(input.instruction);

  logger.debug(
    {
      actionId: input.actionId,
      organizationId: input.appData.organizationId,
      appId: input.appData._id,
      designId: input.designId,
      instructionChars: input.instruction.length,
      elementCount: input.context.design.elements.length,
      allowCanvasResize,
    },
    "Starting gift card AI generate",
  );

  input.emit(GIFT_CARD_AI_SSE_PROGRESS, {
    phase: "preparing",
    label: "Preparing",
  });

  const language = await resolveGiftCardContentLanguage(input.services);

  const session = await createAIToolsSession({
    consumer: "gift-card-ai",
    services: input.services,
    signal: input.signal,
  });

  const messages: AIMessage[] = [
    {
      role: "system",
      content: buildGiftCardAiSystemPrompt({
        language,
        allowCanvasResize,
        needsDesignName,
      }),
    },
    {
      role: "user",
      content: buildGiftCardAiUserPrompt({
        actionId: input.actionId,
        instruction: input.instruction,
        context: {
          ...input.context,
          needsDesignName,
        },
        language,
        allowCanvasResize,
      }),
    },
  ];

  const resolved = resolveModelForTask("document_generation");
  const provider = getAIProvider(resolved.provider);

  logger.debug(
    {
      model: resolved.model,
      provider: resolved.provider,
      toolCount: session.definitions.length,
      language,
    },
    "Gift card AI model and tools ready",
  );

  input.emit(GIFT_CARD_AI_SSE_PROGRESS, {
    phase: "designing",
    label: "Designing card",
  });

  let assistantText = "";

  try {
    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration += 1) {
      if (input.signal.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      const result = await generateWithRetry({
        provider,
        logger,
        actionId: input.actionId,
        generateInput: {
          task: "document_generation",
          model: resolved.model,
          temperature: 0.5,
          maxOutputTokens: 16384,
          promptCacheKey: `gift-card-ai:${input.appData.organizationId}`,
          messages,
          tools: session.definitions,
          abortSignal: input.signal,
        },
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

        input.emit(GIFT_CARD_AI_SSE_PROGRESS, {
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
            "Gift card AI tool execution failed",
          );

          toolResult = {
            error: error?.message || String(error),
          };
        }

        input.emit(GIFT_CARD_AI_SSE_PROGRESS, {
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
            "Gift card AI paused for askUser",
          );

          input.emit(GIFT_CARD_AI_SSE_ASK_USER, toolResult.askUser);
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

    input.emit(GIFT_CARD_AI_SSE_PROGRESS, {
      phase: "parsing",
      label: "Parsing",
    });

    const parsed = await parseProposalWithRetry({
      provider,
      resolved,
      messages,
      assistantText,
      fallbackCanvas: input.context.design.canvas,
      organizationId: input.appData.organizationId,
      signal: input.signal,
      emit: input.emit,
      logger,
      actionId: input.actionId,
    });

    assistantText = parsed.assistantText;
    let proposal = parsed.proposal;

    if (
      !allowCanvasResize &&
      canvasSizeChanged(input.context.design.canvas, proposal.design.canvas)
    ) {
      if (instructionDeclinesCanvasResize(input.instruction)) {
        proposal = {
          ...proposal,
          design: withPreservedCanvasSize(
            proposal.design,
            input.context.design.canvas,
          ),
        };
      } else {
        const askUser = buildCanvasResizeAskUser(
          input.context.design.canvas,
          proposal.design.canvas,
        );

        logger.debug(
          {
            actionId: input.actionId,
            from: input.context.design.canvas,
            to: proposal.design.canvas,
          },
          "Gift card AI paused for canvas resize confirmation",
        );

        input.emit(GIFT_CARD_AI_SSE_ASK_USER, askUser);
        return {
          status: "waiting_for_user",
          askUser,
          text: askUser.question,
        };
      }
    }

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
        elementCount: proposal.design.elements.length,
      },
      "Gift card AI generate completed",
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
      "Gift card AI generate failed",
    );

    throw error;
  }
}
