import type { TEditorBlock } from "@hacado/builder/editor";
import { randomUUID } from "node:crypto";
import type { BuilderAIAdapter } from "../adapters/types";
import { assembleAIContext } from "../context/assembler";
import type { BusinessContextSlice } from "../context/types";
import { resolveModelForTask } from "../models/router";
import { BuilderAIError } from "../provider/errors";
import { getAIProvider } from "../provider/factory";
import { BUILDER_AI_TOOL_DEFINITIONS } from "../tools/definitions";
import { executeBuilderAITool } from "../tools/executor";
import type {
  AIMessage,
  AITask,
  BuilderAIRequest,
  BuilderAIResponse,
  DocumentProposal,
  DocumentSettingsProposal,
  TokenUsage,
} from "../types";
import { trackUsage } from "../usage/tracker";
import { EMAIL_QUALITY_NUDGE, emailNeedsQualityFix } from "./email-quality";
import {
  buildContextMessage,
  buildSystemPrompt,
  inferTaskFromRequest,
} from "./prompts";
import { OFF_TOPIC_REFUSAL, classifyBuilderScope } from "./scope-gate";

export type OrchestratorOptions = {
  adapter: BuilderAIAdapter;
  organizationId: string;
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

function isClarifyingReply(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (trimmed.includes("?")) return true;

  return /please (share|provide|tell|confirm|specify|choose)/i.test(trimmed);
}

function looksLikeFalseCompletion(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (isClarifyingReply(trimmed)) return false;
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

const MISSING_PROPOSAL_NUDGE =
  "No document changes were applied yet. Call proposeDocumentOperations and/or proposeDocumentSettings now. For mirroring a section, use cloneBlockForInsert then add-block. For email subject / page SEO fields, use proposeDocumentSettings. Do not say Done until a propose tool succeeds.";

const MISSING_PROPOSAL_TEXT =
  "I couldn't produce valid document changes. Please try again or say where the section should go.";

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
  /** Last propose attempt (may be invalid) — drives correction / nudge. */
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

    if (!scope.allowed) {
      success = true;

      return {
        conversationId,
        text: OFF_TOPIC_REFUSAL,
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
    const messages: AIMessage[] = [
      { role: "system", content: buildSystemPrompt(request.builder) },
      { role: "user", content: buildContextMessage(context) },
      ...(request.messages ?? []),
      { role: "user", content: request.message },
    ];

    const promptCacheKey = `hacado-builder-ai:${options.organizationId}:${request.builder}`;

    const maxIterations = options.maxToolIterations ?? 12;
    const maxCorrections = options.maxCorrections ?? 2;
    let escalate = false;
    let correctionAttempt = 0;
    let assistantText = "";
    let missingProposalNudged = false;
    let emailQualityNudgeCount = 0;
    let usedDiscoveryTools = false;
    const maxEmailQualityNudges = 2;

    const emailQualityInput = () => ({
      builder: request.builder,
      task,
      message: request.message,
      documentSettings: request.documentSettings,
      proposal,
      settingsProposal,
    });

    const proposalReady = () =>
      hasApplyableProposal(proposal, settingsProposal) &&
      !emailNeedsQualityFix(emailQualityInput());

    while (correctionAttempt <= maxCorrections) {
      const resolved = resolveModelForTask(task, { escalate });
      const provider = getAIProvider(options.providerId ?? resolved.provider);
      lastModel = resolved.model;
      lastProvider = provider.id;
      let iteration = 0;

      while (iteration < maxIterations) {
        iteration += 1;
        modelCalls += 1;
        const result = await provider.generate({
          task,
          model: resolved.model,
          messages,
          tools: BUILDER_AI_TOOL_DEFINITIONS,
          temperature: resolved.temperature,
          maxOutputTokens: resolved.maxOutputTokens,
          promptCacheKey,
        });

        usage = mergeUsage(usage, result.usage);
        assistantText = result.text || assistantText;

        if (!result.toolCalls.length) {
          const shouldNudge =
            taskRequiresProposal(task) &&
            !hasApplyableProposal(proposal, settingsProposal) &&
            !missingProposalNudged &&
            !isClarifyingReply(result.text || assistantText) &&
            (looksLikeFalseCompletion(result.text || assistantText) ||
              usedDiscoveryTools) &&
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
              content: MISSING_PROPOSAL_NUDGE,
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

        for (const toolCall of result.toolCalls) {
          toolCalls += 1;

          if (
            toolCall.name !== "proposeDocumentOperations" &&
            toolCall.name !== "proposeDocumentSettings"
          ) {
            usedDiscoveryTools = true;
          }

          const toolResult = await executeBuilderAITool(
            toolCall.name,
            toolCall.arguments,
            {
              adapter: options.adapter,
              document: request.document,
              selection: request.selection,
              businessRaw: options.businessRaw,
              onProposal: (next) => {
                lastProposeAttempt = next;

                if (isValidProposal(next)) {
                  proposal = next;
                }
              },
              onSettingsProposal: (next) => {
                lastSettingsAttempt = next;

                if (isValidSettingsProposal(next)) {
                  settingsProposal = next;
                }
              },
            },
          );

          if (
            (toolCall.name === "proposeDocumentOperations" ||
              toolCall.name === "proposeDocumentSettings") &&
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
            content: JSON.stringify(toolResult),
          });
        }

        if (
          emailNeedsQualityFix(emailQualityInput()) &&
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
            content: EMAIL_QUALITY_NUDGE,
          });

          continue;
        }

        if (proposalReady()) {
          break;
        }
      }

      if (proposalReady()) {
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
        !proposalReady() &&
        !missingProposalNudged &&
        !isClarifyingReply(assistantText)
      ) {
        missingProposalNudged = true;
        retries += 1;
        correctionAttempt += 1;
        messages.push({
          role: "user",
          content: emailNeedsQualityFix(emailQualityInput())
            ? EMAIL_QUALITY_NUDGE
            : MISSING_PROPOSAL_NUDGE,
        });

        continue;
      }

      break;
    }

    success = true;

    const hasOpsProposal = isValidProposal(proposal);
    const hasSettings = isValidSettingsProposal(settingsProposal);
    const emailIncomplete = emailNeedsQualityFix(emailQualityInput());
    const hasProposal = !emailIncomplete && (hasOpsProposal || hasSettings);

    const text = hasProposal
      ? assistantText ||
        settingsProposal?.summary ||
        proposal?.summary ||
        "Done."
      : taskRequiresProposal(task)
        ? isClarifyingReply(assistantText) &&
          !usedDiscoveryTools &&
          !lastProposeAttempt &&
          !lastSettingsAttempt
          ? assistantText
          : MISSING_PROPOSAL_TEXT
        : assistantText || "Done.";

    return {
      conversationId,
      text,
      proposal: hasOpsProposal && !emailIncomplete ? proposal : undefined,
      // Keep subject even if a body create still failed quality.
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
