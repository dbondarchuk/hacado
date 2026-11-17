import type { AIProvider, ToolResultCache } from "@hacado/ai-core";
import {
  BuilderAIError,
  getAIProvider,
  resolveModelForTask,
  trackUsage,
} from "@hacado/ai-core";
import type { TEditorBlock } from "@hacado/builder/editor-types";
import { randomUUID } from "node:crypto";
import type { BuilderAIAdapter } from "../adapters/types";
import { assembleAIContext } from "../context/assembler";
import type { BusinessContextSlice } from "../context/types";
import { parseAskUserArgs } from "../tools/ask-user";
import { toolsForBuilder } from "../tools/definitions";
import { executeBuilderAITool } from "../tools/executor";
import type {
  AIMessage,
  AITask,
  AIToolCall,
  AskUserRequest,
  BuilderAIRequest,
  BuilderAIResponse,
  DocumentProposal,
  DocumentSettingsProposal,
  GenerateResult,
  TokenUsage,
} from "../types";
import { createToolStepEvent, type BuilderAIStreamEvent } from "./events";
import {
  buildContextMessage,
  buildSystemPrompt,
  inferTaskFromRequest,
} from "./prompts";
import { classifyBuilderScope, OFF_TOPIC_REFUSAL } from "./scope-gate";
import { compactToolResult } from "./tool-result-compact";

export type QualityGateInput = {
  builder: BuilderAIRequest["builder"];
  task: AITask;
  message: string;
  documentSettings?: BuilderAIRequest["documentSettings"];
  proposal?: DocumentProposal;
  settingsProposal?: DocumentSettingsProposal;
};

export type OrchestratorOptions = {
  adapter: BuilderAIAdapter;
  organizationId: string;
  /** Content language for replies and generated copy (brand/page). */
  language?: string;
  /** Localized fallback strings for non-model replies. */
  localizedStrings?: {
    offTopicRefusal?: string;
    missingProposal?: string;
  };
  /** Full surface system prompt. Defaults to buildSystemPrompt (test fallback only). */
  systemPrompt?: string;
  /** Surface-specific soft gate (e.g. email Mustache/name). */
  qualityGate?: {
    needsFix: (input: QualityGateInput) => boolean;
    nudge: string;
  };
  cache?: ToolResultCache;
  searchDesignPatterns?: (input: {
    query: string;
    limit?: number;
  }) => Promise<unknown> | unknown;
  searchStockImages?: (input: {
    query: string;
    count?: number;
  }) => Promise<unknown> | unknown;
  searchStockVideos?: (input: {
    query: string;
    count?: number;
  }) => Promise<unknown> | unknown;
  searchPages?: (input: {
    query?: string;
    limit?: number;
    publishedOnly?: boolean;
  }) => Promise<unknown> | unknown;
  connectedApps?: Array<{
    appId: string;
    appName: string;
    metadataKey?: string;
    blockTypesHint?: string[];
  }>;
  documentChrome?: {
    availableHeaders?: Array<{ id: string; name: string; usedCount?: number }>;
    availableFooters?: Array<{ id: string; name: string; usedCount?: number }>;
  };
  businessRaw?: {
    general?: Record<string, unknown> | null;
    brand?: Record<string, unknown> | null;
    social?: Record<string, unknown> | null;
    styling?: Record<string, unknown> | null;
    services?: BusinessContextSlice["services"];
    addons?: BusinessContextSlice["addons"];
    packages?: BusinessContextSlice["packages"];
    members?: BusinessContextSlice["members"];
  };
  business?: BusinessContextSlice;
  maxToolIterations?: number;
  maxCorrections?: number;
  providerId?: string;
  abortSignal?: AbortSignal;
  /** Progress + text deltas for SSE clients. Result is still returned. */
  onEvent?: (event: BuilderAIStreamEvent) => void;
};

function mergeUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
  return {
    inputTokens: (a.inputTokens ?? 0) + (b.inputTokens ?? 0),
    outputTokens: (a.outputTokens ?? 0) + (b.outputTokens ?? 0),
    cachedInputTokens: (a.cachedInputTokens ?? 0) + (b.cachedInputTokens ?? 0),
    reasoningTokens: (a.reasoningTokens ?? 0) + (b.reasoningTokens ?? 0),
    totalTokens: (a.totalTokens ?? 0) + (b.totalTokens ?? 0),
  };
}

const EDIT_TASKS = new Set<AITask>([
  "document_editing",
  "document_generation",
  "copywriting",
]);

function taskRequiresProposal(task: AITask): boolean {
  return EDIT_TASKS.has(task);
}

function isValidProposal(
  proposal: DocumentProposal | undefined,
): proposal is DocumentProposal {
  return (
    !!proposal && !proposal.warnings?.length && proposal.operations.length > 0
  );
}

function isValidSettingsProposal(
  proposal: DocumentSettingsProposal | undefined,
): proposal is DocumentSettingsProposal {
  return (
    !!proposal &&
    !proposal.warnings?.length &&
    Object.keys(proposal.settings).length > 0
  );
}

function hasApplyableProposal(
  proposal: DocumentProposal | undefined,
  settingsProposal: DocumentSettingsProposal | undefined,
): boolean {
  return isValidProposal(proposal) || isValidSettingsProposal(settingsProposal);
}

function looksLikeFalseCompletion(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (trimmed.length > 160) return false;

  return (
    /^(done|applied|updated|added|all set|completed|finished)\b/i.test(
      trimmed,
    ) ||
    /\b(i('ve| have) (added|updated|applied|created)|section (is|was) (added|updated)|changes? (are|were) (applied|made))\b/i.test(
      trimmed,
    )
  );
}

const PROPOSE_NUDGE =
  "No document changes were applied yet. Use available tools and call proposeDocumentOperations and/or proposeDocumentSettings now. Prefer cloneBlockForInsert when mirroring an existing section; otherwise build from defaults. Do not ask the user for data tools can provide, and do not ask them to edit the document manually. If a required fact is only known by the user and tools do not have it, call askUser (structured) and stop - do not invent placeholders or ask only in free text. Do not say Done until a propose tool succeeds.";

const PROPOSE_NUDGE_TEXT_MESSAGE =
  "No message changes were applied yet. Call getTemplateArgs and getDocumentSettings as needed, then proposeDocumentSettings with value (Mustache SMS body) and name when empty. Do not call proposeDocumentOperations. Do not ask the user for data tools can provide. If a required fact is only known by the user, call askUser and stop.";

const SETTINGS_NUDGE =
  "Block changes alone are not enough for create/design/redesign. Call getDocumentSettings, then proposeDocumentSettings now (page: title, slug, description, keywords, and headerId/footerId when choosing chrome; email: name + subject; footer: name). Keep any valid proposeDocumentOperations.";

const SUMMARY_NUDGE =
  'Changes are proposed. Reply with ONLY a short past-tense summary of what you did for the user (e.g. "Created a gel strengthening service page with overview, inclusions, and a Book CTA."). Do not call tools. Do not describe plans or future tense.';

const MISSING_PROPOSAL_TEXT =
  "I couldn't produce valid document changes. Please try again or say where the section should go.";

function looksLikePlanningReply(text: string): boolean {
  const trimmed = text.trim();

  if (!trimmed) return true;

  if (
    /^(created|updated|redesigned|added|set|built|wrote|applied|improved)\b/i.test(
      trimmed,
    )
  ) {
    return false;
  }

  return /^(i('|’)ll|i will|let me|i('|’)m going to|i am going to|here('|’)s (my|the) plan|i plan to)\b/i.test(
    trimmed,
  );
}

function requestNeedsHostSettings(input: {
  task: AITask;
  message: string;
  actionId?: string;
}): boolean {
  if (input.task === "document_generation") return true;

  const text = `${input.actionId ?? ""} ${input.message}`.toLowerCase();

  return (
    text.includes("redesign") ||
    text.includes("design") ||
    text.includes("create page") ||
    text.includes("create email") ||
    text.includes("create text") ||
    text.includes("create sms") ||
    text.includes("new page") ||
    text.includes("new email") ||
    text.includes("new text") ||
    text.includes("build a page") ||
    text.includes("build an email") ||
    text.includes("build a text")
  );
}

function settingsProposalComplete(
  builder: BuilderAIRequest["builder"],
  settingsProposal: DocumentSettingsProposal | undefined,
): boolean {
  if (!isValidSettingsProposal(settingsProposal)) return false;

  const settings = settingsProposal.settings;

  if (builder === "page") {
    return Boolean(settings.title && settings.slug);
  }

  if (builder === "email") {
    return Boolean(settings.name && settings.subject);
  }

  if (builder === "text-message") {
    return Boolean(settings.value);
  }

  return Boolean(settings.name);
}

function proposeNudgeFor(builder: BuilderAIRequest["builder"]): string {
  return builder === "text-message"
    ? PROPOSE_NUDGE_TEXT_MESSAGE
    : PROPOSE_NUDGE;
}

async function runModelTurn(input: {
  provider: AIProvider;
  task: AITask;
  model: string;
  messages: AIMessage[];
  builder: BuilderAIRequest["builder"];
  temperature?: number;
  maxOutputTokens?: number;
  promptCacheKey?: string;
  abortSignal?: AbortSignal;
  onEvent?: (event: BuilderAIStreamEvent) => void;
}): Promise<GenerateResult> {
  const generateInput = {
    task: input.task,
    model: input.model,
    messages: input.messages,
    tools: toolsForBuilder(input.builder),
    temperature: input.temperature,
    maxOutputTokens: input.maxOutputTokens,
    promptCacheKey: input.promptCacheKey,
    abortSignal: input.abortSignal,
  };

  if (typeof input.provider.stream === "function") {
    let text = "";
    const toolCalls: AIToolCall[] = [];
    let finish: GenerateResult | undefined;

    for await (const chunk of input.provider.stream(generateInput)) {
      if (input.abortSignal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      if (chunk.type === "text-delta") {
        if (chunk.textDelta) {
          text += chunk.textDelta;
          input.onEvent?.({ type: "text-delta", text: chunk.textDelta });
        }
      } else if (chunk.type === "tool-call") {
        toolCalls.push(chunk.toolCall);
      } else if (chunk.type === "finish") {
        finish = chunk.result;
      } else if (chunk.type === "error") {
        throw new BuilderAIError(chunk.error);
      }
    }

    if (finish) {
      return {
        ...finish,
        text: finish.text || text,
        toolCalls: finish.toolCalls.length ? finish.toolCalls : toolCalls,
      };
    }

    return {
      text,
      toolCalls,
      usage: {},
      finishReason: "stop",
      model: input.model,
      provider: input.provider.id,
      durationMs: 0,
    };
  }

  const result = await input.provider.generate(generateInput);

  if (result.text) {
    input.onEvent?.({ type: "text-delta", text: result.text });
  }

  return result;
}

export async function runBuilderAIOrchestrator(
  request: BuilderAIRequest,
  options: OrchestratorOptions,
): Promise<BuilderAIResponse> {
  const started = Date.now();
  const conversationId = request.conversationId ?? randomUUID();
  const task = inferTaskFromRequest({
    message: request.message,
    actionId: request.actionId,
    selectionType: request.selection.selectionType,
  });

  let modelCalls = 0;
  let toolCalls = 0;
  let retries = 0;
  let escalations = 0;
  let usage: TokenUsage = {};
  /** Only a validated, non-empty proposal is returned to the client. */
  let proposal: DocumentProposal | undefined;
  let settingsProposal: DocumentSettingsProposal | undefined;
  /** Structured pause - not a document operation. */
  let askUser: AskUserRequest | undefined;
  /** Last propose attempt (may be invalid) - drives correction / nudge. */
  let lastProposeAttempt: DocumentProposal | undefined;
  let lastSettingsAttempt: DocumentSettingsProposal | undefined;
  let lastModel = "";
  let lastProvider = "";
  let success = false;
  let errorCode: string | undefined;

  try {
    const scope = await classifyBuilderScope({
      message: request.message,
      builder: request.builder,
      actionId: request.actionId,
      providerId: options.providerId,
    });

    if (scope.usage) {
      usage = mergeUsage(usage, scope.usage);
      modelCalls += 1;
    }

    if (scope.model) lastModel = scope.model;
    if (scope.provider) lastProvider = scope.provider;

    const language = options.language ?? "en";
    const offTopicRefusal =
      options.localizedStrings?.offTopicRefusal ?? OFF_TOPIC_REFUSAL;

    const missingProposalText =
      options.localizedStrings?.missingProposal ?? MISSING_PROPOSAL_TEXT;

    if (!scope.allowed) {
      success = true;

      return {
        conversationId,
        text: offTopicRefusal,
        status: "completed",
        usage,
        model: lastModel || "scope-gate",
        provider: lastProvider || "scope-gate",
        task: "intent_classification",
      };
    }

    const context = await assembleAIContext({
      adapter: options.adapter,
      document: request.document,
      selection: request.selection,
      instruction: request.message,
      actionId: request.actionId,
      business: options.business,
      args: request.args,
      documentSettings: request.documentSettings,
    });

    // Stable system prompt first (prompt-cache prefix). Volatile document
    // context is a separate user turn so it does not bust that prefix.
    // Continuity: conversationId + prior turns in request.messages.
    const systemPrompt =
      options.systemPrompt ?? buildSystemPrompt(request.builder, language);

    const messages: AIMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: buildContextMessage(context, language) },
      ...(request.messages ?? []),
      { role: "user", content: request.message },
    ];

    const promptCacheKey = `hacado-ai:${options.organizationId}:${request.builder}`;
    const qualityNeedsFix = options.qualityGate?.needsFix ?? (() => false);

    const qualityNudge = options.qualityGate?.nudge ?? "";

    const maxIterations = options.maxToolIterations ?? 12;
    const maxCorrections = options.maxCorrections ?? 2;
    let escalate = false;
    let correctionAttempt = 0;
    let assistantText = "";
    let missingProposalNudged = false;
    let discoverySpiralNudged = false;
    let settingsNudged = false;
    let summaryNudged = false;
    let emailQualityNudgeCount = 0;
    let usedDiscoveryTools = false;
    let discoveryToolCalls = 0;
    const maxEmailQualityNudges = 2;
    const discoveryBudgetBeforeProposeNudge = 5;
    const needsHostSettings = requestNeedsHostSettings({
      task,
      message: request.message,
      actionId: request.actionId,
    });

    const qualityInput = (): QualityGateInput => ({
      builder: request.builder,
      task,
      message: request.message,
      documentSettings: request.documentSettings,
      proposal,
      settingsProposal,
    });

    const proposalReady = () => {
      if (qualityNeedsFix(qualityInput())) return false;

      if (request.builder === "text-message") {
        return settingsProposalComplete(request.builder, settingsProposal);
      }

      if (needsHostSettings) {
        return (
          isValidProposal(proposal) &&
          settingsProposalComplete(request.builder, settingsProposal)
        );
      }

      return hasApplyableProposal(proposal, settingsProposal);
    };

    const proposeNudge = proposeNudgeFor(request.builder);

    while (correctionAttempt <= maxCorrections) {
      const resolved = resolveModelForTask(task, { escalate });
      const provider = getAIProvider(options.providerId ?? resolved.provider);
      lastModel = resolved.model;
      lastProvider = provider.id;
      let iteration = 0;

      while (iteration < maxIterations) {
        iteration += 1;
        modelCalls += 1;

        if (options.abortSignal?.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }

        const result = await runModelTurn({
          provider,
          task,
          model: resolved.model,
          messages,
          builder: request.builder,
          temperature: resolved.temperature,
          maxOutputTokens: resolved.maxOutputTokens,
          promptCacheKey,
          abortSignal: options.abortSignal,
          onEvent: options.onEvent,
        });

        usage = mergeUsage(usage, result.usage);
        assistantText = result.text || assistantText;

        if (!result.toolCalls.length) {
          const replyText = result.text || assistantText;

          const shouldNudge =
            taskRequiresProposal(task) &&
            !askUser &&
            !hasApplyableProposal(proposal, settingsProposal) &&
            !missingProposalNudged &&
            (looksLikeFalseCompletion(replyText) || usedDiscoveryTools) &&
            iteration < maxIterations;

          if (shouldNudge) {
            missingProposalNudged = true;
            retries += 1;
            messages.push({
              role: "assistant",
              content: result.text || "",
            });

            messages.push({
              role: "user",
              content: proposeNudge,
            });

            continue;
          }

          break;
        }

        messages.push({
          role: "assistant",
          content: result.text || "",
          toolCalls: result.toolCalls,
        });

        let pausedForAskUser = false;
        const askUserCall = result.toolCalls.find(
          (toolCall) => toolCall.name === "askUser",
        );

        // If askUser is present, run it first and skip document mutations.
        const orderedToolCalls = askUserCall
          ? [
              askUserCall,
              ...result.toolCalls.filter(
                (toolCall) => toolCall !== askUserCall,
              ),
            ]
          : result.toolCalls;

        for (const toolCall of orderedToolCalls) {
          // Once askUser fires, ignore later tools in this model turn
          // (including propose) until the user answers.
          if (pausedForAskUser) break;

          toolCalls += 1;

          const isProposeTool =
            toolCall.name === "proposeDocumentOperations" ||
            toolCall.name === "proposeDocumentSettings";

          const isAskUserTool = toolCall.name === "askUser";

          if (!isProposeTool && !isAskUserTool) {
            usedDiscoveryTools = true;
            discoveryToolCalls += 1;
          }

          options.onEvent?.(createToolStepEvent(toolCall, "start"));

          const toolResult = await executeBuilderAITool(
            toolCall.name,
            toolCall.arguments,
            {
              adapter: options.adapter,
              document: request.document,
              selection: request.selection,
              organizationId: options.organizationId,
              documentSettings: request.documentSettings,
              templateArgs: request.args,
              cache: options.cache,
              searchDesignPatterns: options.searchDesignPatterns,
              searchStockImages: options.searchStockImages,
              searchStockVideos: options.searchStockVideos,
              searchPages: options.searchPages,
              connectedApps: options.connectedApps,
              documentChrome: options.documentChrome,
              businessRaw: options.businessRaw,
              onProposal: (next) => {
                if (askUser || pausedForAskUser) return;

                lastProposeAttempt = next;

                if (isValidProposal(next)) {
                  proposal = next;
                }
              },
              onSettingsProposal: (next) => {
                if (askUser || pausedForAskUser) return;

                lastSettingsAttempt = next;

                if (isValidSettingsProposal(next)) {
                  settingsProposal = next;
                }
              },
            },
          );

          options.onEvent?.(createToolStepEvent(toolCall, "done"));

          if (isAskUserTool) {
            const parsed =
              toolResult &&
              typeof toolResult === "object" &&
              "askUser" in toolResult
                ? parseAskUserArgs(
                    (toolResult as { askUser: Record<string, unknown> })
                      .askUser as Record<string, unknown>,
                  )
                : parseAskUserArgs(toolCall.arguments);

            messages.push({
              role: "tool",
              name: toolCall.name,
              toolCallId: toolCall.id,
              content: compactToolResult(toolResult, toolCall.name),
            });

            if (parsed) {
              askUser = parsed;
              proposal = undefined;
              settingsProposal = undefined;
              lastProposeAttempt = undefined;
              lastSettingsAttempt = undefined;
              pausedForAskUser = true;
            }

            continue;
          }

          if (
            isProposeTool &&
            toolResult &&
            typeof toolResult === "object" &&
            "validation" in toolResult &&
            !(toolResult as { validation: { valid: boolean } }).validation.valid
          ) {
            retries += 1;
          }

          messages.push({
            role: "tool",
            name: toolCall.name,
            toolCallId: toolCall.id,
            content: compactToolResult(toolResult, toolCall.name),
          });
        }

        if (askUser) {
          break;
        }

        if (
          qualityNudge &&
          qualityNeedsFix(qualityInput()) &&
          (hasApplyableProposal(proposal, settingsProposal) ||
            isValidSettingsProposal(settingsProposal) ||
            isValidProposal(proposal)) &&
          emailQualityNudgeCount < maxEmailQualityNudges &&
          iteration < maxIterations
        ) {
          emailQualityNudgeCount += 1;
          retries += 1;
          messages.push({
            role: "user",
            content: qualityNudge,
          });

          continue;
        }

        if (
          needsHostSettings &&
          request.builder !== "text-message" &&
          isValidProposal(proposal) &&
          !settingsProposalComplete(request.builder, settingsProposal) &&
          !settingsNudged &&
          iteration < maxIterations
        ) {
          settingsNudged = true;
          retries += 1;
          messages.push({
            role: "user",
            content: SETTINGS_NUDGE,
          });

          continue;
        }

        if (
          !proposalReady() &&
          !discoverySpiralNudged &&
          discoveryToolCalls >= discoveryBudgetBeforeProposeNudge &&
          !(request.builder === "text-message"
            ? isValidSettingsProposal(settingsProposal)
            : isValidProposal(proposal)) &&
          iteration < maxIterations
        ) {
          discoverySpiralNudged = true;
          missingProposalNudged = true;
          retries += 1;
          messages.push({
            role: "user",
            content: proposeNudge,
          });

          continue;
        }

        if (
          proposalReady() &&
          looksLikePlanningReply(assistantText) &&
          !summaryNudged &&
          iteration < maxIterations
        ) {
          summaryNudged = true;
          messages.push({
            role: "user",
            content: SUMMARY_NUDGE,
          });

          continue;
        }

        if (proposalReady()) {
          break;
        }
      }

      if (askUser || proposalReady()) {
        break;
      }

      const failedWarnings = [
        ...(lastProposeAttempt?.warnings ?? []),
        ...(lastSettingsAttempt?.warnings ?? []),
      ];

      if (failedWarnings.length && correctionAttempt < maxCorrections) {
        correctionAttempt += 1;
        retries += 1;
        messages.push({
          role: "user",
          content: `Validation failed:\n${failedWarnings.join("\n")}\nFix the proposal and try again.`,
        });

        lastProposeAttempt = undefined;
        lastSettingsAttempt = undefined;
        continue;
      }

      if (
        failedWarnings.length &&
        !escalate &&
        resolved.fallback &&
        correctionAttempt < maxCorrections
      ) {
        escalate = true;
        escalations += 1;
        correctionAttempt += 1;
        messages.push({
          role: "user",
          content:
            "Previous attempt failed validation. Escalate and propose corrected changes.",
        });

        lastProposeAttempt = undefined;
        lastSettingsAttempt = undefined;
        continue;
      }

      if (
        taskRequiresProposal(task) &&
        !askUser &&
        !proposalReady() &&
        !missingProposalNudged
      ) {
        missingProposalNudged = true;
        retries += 1;
        correctionAttempt += 1;
        messages.push({
          role: "user",
          content:
            qualityNudge && qualityNeedsFix(qualityInput())
              ? qualityNudge
              : proposeNudge,
        });

        continue;
      }

      break;
    }

    success = true;

    if (askUser) {
      return {
        conversationId,
        text: assistantText.trim() || askUser.question,
        status: "waiting_for_user",
        askUser,
        usage,
        model: lastModel,
        provider: lastProvider,
        task,
      };
    }

    const hasOpsProposal = isValidProposal(proposal);
    const hasSettings = isValidSettingsProposal(settingsProposal);
    const qualityIncomplete = qualityNeedsFix(qualityInput());
    const hasProposal = !qualityIncomplete && (hasOpsProposal || hasSettings);

    const failedWarnings = [
      ...(lastProposeAttempt?.warnings ?? []),
      ...(lastSettingsAttempt?.warnings ?? []),
    ];

    const fallbackDoneSummary =
      settingsProposal?.summary || proposal?.summary
        ? String(settingsProposal?.summary || proposal?.summary).replace(
            /^(create|update|redesign|build|add|set)\b/i,
            (match) => {
              const map: Record<string, string> = {
                create: "Created",
                update: "Updated",
                redesign: "Redesigned",
                build: "Built",
                add: "Added",
                set: "Set",
              };

              return map[match.toLowerCase()] ?? match;
            },
          )
        : "Done.";

    const failedText = failedWarnings.length
      ? `I couldn't apply those changes:\n${failedWarnings.slice(0, 4).join("\n")}`
      : missingProposalText;

    const text = hasProposal
      ? looksLikePlanningReply(assistantText)
        ? fallbackDoneSummary
        : assistantText || fallbackDoneSummary
      : taskRequiresProposal(task)
        ? failedText
        : assistantText || "Done.";

    const status =
      hasProposal || !taskRequiresProposal(task) ? "completed" : "failed";

    return {
      conversationId,
      text,
      status,
      proposal: hasOpsProposal && !qualityIncomplete ? proposal : undefined,
      // Keep settings even if a body create still failed quality.
      settingsProposal: hasSettings ? settingsProposal : undefined,
      usage,
      model: lastModel,
      provider: lastProvider,
      task,
    };
  } catch (error) {
    errorCode = error instanceof BuilderAIError ? error.code : "unknown";

    throw error;
  } finally {
    await trackUsage({
      organizationId: options.organizationId,
      builder: request.builder,
      task,
      provider: lastProvider || "unknown",
      model: lastModel || "unknown",
      success,
      usage,
      modelCalls,
      toolCalls,
      retries,
      escalations,
      durationMs: Date.now() - started,
      conversationId,
      errorCode,
      timestamp: new Date().toISOString(),
    });
  }
}

export function createSelectionPayload(input: {
  builder: BuilderAIRequest["builder"];
  document: TEditorBlock;
  documentRevision: string;
  selectedBlockIds?: string[];
  documentId?: string;
}): BuilderAIRequest["selection"] {
  const selectedBlockIds = input.selectedBlockIds ?? [];
  const selectedBlockTypes: string[] = [];

  // Types filled by caller when known; keep ids authoritative.
  return {
    builder: input.builder,
    documentId: input.documentId,
    documentRevision: input.documentRevision,
    selectionType:
      selectedBlockIds.length === 0
        ? "document"
        : selectedBlockIds.length === 1
          ? "block"
          : "blocks",
    selectedBlockIds,
    selectedBlockTypes,
    selectedSlot: null,
  };
}

export type { AITask };
