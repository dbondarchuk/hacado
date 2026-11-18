"use client";

import { stockMediaApi } from "@hacado/api-sdk/admin/stock-media";
import { useI18n } from "@hacado/i18n/client";
import {
  AiActionLink,
  AiChatShell,
  AiComposer,
  AiMessageBubble,
  formatElapsed,
  useElapsedMs,
  type AiChatMessage,
  type AiChatStreamSegment,
} from "@hacado/ui-admin-kit/ai";
import { Button } from "@hacado/ui/button";
import { cn } from "@hacado/ui/cn";
import { useWebsiteUrl } from "@hacado/ui/context";
import { RotateCcw, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { generateGiftCardDesignAi } from "../actions";
import { useEditorStore } from "../designer/lib/store";
import type { Design, Paint } from "../designer/lib/types";
import type { GiftCardAiGenerateAction } from "../models";
import {
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
  giftCardStudioAdminNamespace,
} from "../translations/types";
import { toAbsoluteImageUrl } from "./absolute-image-url";
import { GIFT_CARD_AI_ACTIONS, type GiftCardAiActionId } from "./actions";
import {
  GIFT_CARD_AI_SSE_ASK_USER,
  GIFT_CARD_AI_SSE_DELTA,
  GIFT_CARD_AI_SSE_PROGRESS,
  type GiftCardAiAskUserPayload,
  type GiftCardAiDeltaPayload,
  type GiftCardAiProgressPayload,
} from "./events";
import type { GiftCardAiProposal } from "./schema";

const PROGRESS_MAX_VISIBLE = 12;
const PROGRESS_IDLE_MS = 5_000;

const PROGRESS_FILLER_KEYS = [
  "drafting",
  "sketching",
  "palette",
  "type",
  "fields",
  "contrast",
  "margins",
  "ribbon",
  "corners",
  "spirits",
  "stillThinking",
  "looseEnds",
] as const;

type GiftCardAiChatMessage = AiChatMessage & {
  proposal?: GiftCardAiProposal | null;
  applied?: boolean;
  error?: string | null;
  /** Action that produced this user turn (for Retry). */
  actionId?: GiftCardAiActionId;
  /** Instruction text sent with the action (for Retry). */
  instruction?: string | null;
  /** Canvas snapshot before this assistant turn applied a proposal. */
  designBeforeApply?: Design | null;
  /** Form name before this turn (for Retry restore). */
  nameBeforeApply?: string | null;
};

type ResolvedAction = {
  id: GiftCardAiActionId;
  label: string;
};

function newMessageId(): string {
  return `gift-card-ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function appendStepSegment(
  segments: AiChatStreamSegment[] | undefined,
  label: string,
): AiChatStreamSegment[] {
  const next = [...(segments ?? [])];
  const last = next[next.length - 1];

  if (last?.type === "steps") {
    if (last.steps[last.steps.length - 1] === label) return next;

    next[next.length - 1] = { type: "steps", steps: [...last.steps, label] };
    return next;
  }

  next.push({ type: "steps", steps: [label] });
  return next;
}

function appendTextSegment(
  segments: AiChatStreamSegment[] | undefined,
  text: string,
): AiChatStreamSegment[] {
  const next = [...(segments ?? [])];
  const last = next[next.length - 1];

  if (last?.type === "text") {
    next[next.length - 1] = { type: "text", text: `${last.text}${text}` };
    return next;
  }

  next.push({ type: "text", text });
  return next;
}

function looksLikeJsonPayload(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.startsWith("{") || trimmed.startsWith("```");
}

/** Keep steps + human narration in stream order; drop raw JSON dumps. */
function keepDisplaySegments(
  segments: AiChatStreamSegment[] | undefined,
): AiChatStreamSegment[] | undefined {
  const kept = (segments ?? []).filter((segment) => {
    if (segment.type === "steps") return true;

    return (
      segment.type === "text" &&
      Boolean(segment.text.trim()) &&
      !looksLikeJsonPayload(segment.text)
    );
  });

  return kept.length ? kept : undefined;
}

function finalizeAssistantSegments(
  segments: AiChatStreamSegment[] | undefined,
  summary: string,
): { segments: AiChatStreamSegment[]; content: string } {
  const next = [...(keepDisplaySegments(segments) ?? [])];
  const narration = next.filter(
    (segment): segment is Extract<AiChatStreamSegment, { type: "text" }> =>
      segment.type === "text",
  );

  const hasSummaryAlready = narration.some((segment) =>
    segment.text.includes(summary),
  );

  if (!hasSummaryAlready) {
    next.push({ type: "text", text: summary });
  }

  return {
    segments: next,
    content: next
      .filter(
        (segment): segment is Extract<AiChatStreamSegment, { type: "text" }> =>
          segment.type === "text",
      )
      .map((segment) => segment.text.trim())
      .join("\n\n"),
  };
}

async function resolveStockUrl(query: string): Promise<string | undefined> {
  try {
    const search = await stockMediaApi.search({
      provider: "unsplash",
      type: "photo",
      query: query.trim(),
      page: 1,
      limit: 1,
    });

    const photo = search.items[0];
    if (!photo) return undefined;

    void stockMediaApi
      .trackDownload({
        provider: "unsplash",
        downloadLocation: photo.downloadLocation,
      })
      .catch(() => undefined);

    return photo.urls.regular;
  } catch {
    return undefined;
  }
}

function absolutizePaint(
  paint: Paint | undefined,
  websiteUrl: string,
): Paint | undefined {
  if (!paint || paint.type !== "image") return paint;

  const src = toAbsoluteImageUrl(paint.image?.src, websiteUrl);
  if (!src) return { type: "none" };

  return {
    ...paint,
    image: {
      ...paint.image,
      src,
    },
  };
}

async function resolveProposalImages(
  proposal: GiftCardAiProposal,
  websiteUrl: string,
): Promise<Design> {
  const design = structuredClone(proposal.design) as Design;
  const queryById = new Map(
    (proposal.imageQueries ?? []).map((entry) => [entry.id, entry.query]),
  );

  await Promise.all(
    design.elements.map(async (element) => {
      if (element.type === "image") {
        const query = queryById.get(element.id);
        if (query?.trim()) {
          const url = await resolveStockUrl(query);
          if (url) {
            element.src = url;
            return;
          }
        }

        element.src = toAbsoluteImageUrl(element.src, websiteUrl) ?? "";
        return;
      }

      if (element.type === "shape") {
        element.styles = {
          ...element.styles,
          fillPaint: absolutizePaint(element.styles.fillPaint, websiteUrl),
          strokePaint: absolutizePaint(element.styles.strokePaint, websiteUrl),
        };
      }
    }),
  );

  if (design.canvas.background?.type === "image") {
    let src: string | undefined;

    if (proposal.canvasBackgroundImageQuery?.trim()) {
      src = await resolveStockUrl(proposal.canvasBackgroundImageQuery);
    }

    src =
      src ??
      toAbsoluteImageUrl(design.canvas.background.image?.src, websiteUrl);

    if (src) {
      design.canvas.background = {
        ...design.canvas.background,
        image: {
          ...(design.canvas.background.image ?? { src }),
          src,
        },
      };
    } else {
      design.canvas.background = undefined;
    }
  }

  return design;
}

export function GiftCardAiPanel({
  appId,
  designId,
  disabled,
  className,
}: {
  appId: string;
  designId?: string;
  disabled?: boolean;
  className?: string;
}) {
  const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
    giftCardStudioAdminNamespace,
  );

  const tAll = useI18n();
  const websiteUrl = useWebsiteUrl();
  const form = useFormContext<{ name?: string }>();
  const replaceDesign = useEditorStore((state) => state.replaceDesign);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<GiftCardAiChatMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const liveAssistantIdRef = useRef<string | null>(null);
  const progressIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const progressFillerIndexRef = useRef(0);
  const elapsedMs = useElapsedMs(loading);

  const clearIdleProgressTimer = useCallback(() => {
    if (progressIdleTimerRef.current) {
      clearTimeout(progressIdleTimerRef.current);
      progressIdleTimerRef.current = null;
    }
  }, []);

  const appendLiveStep = useCallback((assistantId: string, label: string) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === assistantId
          ? {
              ...message,
              segments: appendStepSegment(message.segments, label),
            }
          : message,
      ),
    );
  }, []);

  const scheduleIdleFiller = useCallback(
    (assistantId: string) => {
      clearIdleProgressTimer();
      progressIdleTimerRef.current = setTimeout(() => {
        if (liveAssistantIdRef.current !== assistantId) return;

        const fillers = PROGRESS_FILLER_KEYS.map((key) =>
          t(`designer.ai.progress.${key}`),
        );

        setMessages((current) => {
          const live = current.find((message) => message.id === assistantId);
          const steps = (live?.segments ?? []).flatMap((segment) =>
            segment.type === "steps" ? segment.steps : [],
          );

          let attempts = 0;
          let label = fillers[progressFillerIndexRef.current % fillers.length]!;

          while (
            attempts < fillers.length &&
            steps[steps.length - 1] === label
          ) {
            progressFillerIndexRef.current += 1;
            label = fillers[progressFillerIndexRef.current % fillers.length]!;
            attempts += 1;
          }

          progressFillerIndexRef.current += 1;

          return current.map((message) => {
            if (message.id !== assistantId) return message;

            let segments = appendStepSegment(message.segments, label);
            const last = segments[segments.length - 1];

            if (
              last?.type === "steps" &&
              last.steps.length > PROGRESS_MAX_VISIBLE
            ) {
              segments = [
                ...segments.slice(0, -1),
                {
                  type: "steps",
                  steps: last.steps.slice(-PROGRESS_MAX_VISIBLE),
                },
              ];
            }

            return { ...message, segments };
          });
        });

        scheduleIdleFiller(assistantId);
      }, PROGRESS_IDLE_MS);
    },
    [clearIdleProgressTimer, t],
  );

  const beginProgress = useCallback(
    (assistantId: string) => {
      clearIdleProgressTimer();
      progressFillerIndexRef.current = 0;
      const label = t("designer.ai.progress.understanding");
      appendLiveStep(assistantId, label);
      scheduleIdleFiller(assistantId);
    },
    [appendLiveStep, clearIdleProgressTimer, scheduleIdleFiller, t],
  );

  const noteProgressActivity = useCallback(
    (assistantId: string) => {
      scheduleIdleFiller(assistantId);
    },
    [scheduleIdleFiller],
  );

  useEffect(() => {
    return () => {
      clearIdleProgressTimer();
      abortRef.current?.abort();
    };
  }, [clearIdleProgressTimer]);

  const quickActions = useMemo<ResolvedAction[]>(
    () =>
      GIFT_CARD_AI_ACTIONS.filter(
        (action) => action.id !== "custom_instruction",
      ).map((action) => ({
        id: action.id,
        label: t(action.labelKey),
      })),
    [t],
  );

  const patchAssistant = useCallback(
    (messageId: string, patch: Partial<GiftCardAiChatMessage>) => {
      setMessages((current) =>
        current.map((message) =>
          message.id === messageId ? { ...message, ...patch } : message,
        ),
      );
    },
    [],
  );

  const applyProposal = useCallback(
    async (messageId: string, proposal: GiftCardAiProposal) => {
      try {
        const design = await resolveProposalImages(proposal, websiteUrl);
        replaceDesign(design);

        const suggestedName = proposal.name?.trim();
        const currentName = String(form.getValues("name") ?? "").trim();

        if (suggestedName && !currentName) {
          form.setValue("name", suggestedName.slice(0, 64), {
            shouldDirty: true,
            shouldValidate: true,
          });
        }

        patchAssistant(messageId, { proposal, applied: true });
      } catch (err: any) {
        patchAssistant(messageId, {
          proposal,
          applied: false,
          error: err?.message || t("designer.ai.errorGeneric"),
        });
      }
    },
    [form, patchAssistant, replaceDesign, t, websiteUrl],
  );

  const runAction = useCallback(
    async (
      actionId: GiftCardAiActionId,
      customInstruction?: string,
      options?: { replyToQuestion?: string | null },
    ) => {
      const text =
        customInstruction?.trim() ||
        (actionId === "custom_instruction" ? draft.trim() : "");

      if (actionId === "custom_instruction" && !text) {
        const errorId = newMessageId();
        setMessages((current) => [
          ...current,
          {
            id: errorId,
            role: "assistant",
            content: "",
            error: t("designer.ai.emptyInstruction"),
            createdAt: Date.now(),
          },
        ]);

        return;
      }

      abortRef.current?.abort();
      const abortController = new AbortController();
      abortRef.current = abortController;

      const userContent =
        text ||
        quickActions.find((action) => action.id === actionId)?.label ||
        actionId;

      const designBeforeApply = structuredClone(
        useEditorStore.getState().design,
      ) as Design;

      const nameBeforeApply = String(form.getValues("name") ?? "");
      const needsDesignName =
        !designId ||
        !nameBeforeApply.trim() ||
        designBeforeApply.elements.length === 0;

      const userMessage: GiftCardAiChatMessage = {
        id: newMessageId(),
        role: "user",
        content: userContent,
        actionId,
        instruction: text || null,
        replyToQuestion: options?.replyToQuestion ?? null,
        createdAt: Date.now(),
      };

      const assistantId = newMessageId();
      const assistantMessage: GiftCardAiChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        segments: [],
        designBeforeApply,
        nameBeforeApply,
        createdAt: Date.now(),
      };

      setMessages((current) => [...current, userMessage, assistantMessage]);
      setLoading(true);
      setDraft("");
      liveAssistantIdRef.current = assistantId;
      beginProgress(assistantId);

      try {
        const { design, selectedElements } = useEditorStore.getState();
        const result = await generateGiftCardDesignAi(
          appId,
          {
            actionId,
            instruction: text || undefined,
            designId,
            // Runtime Design vs zod Paint unions are structurally compatible at runtime.
            design: design as unknown as GiftCardAiGenerateAction["design"],
            selectionIds: selectedElements,
            currentName: nameBeforeApply,
            needsDesignName,
          },
          {
            signal: abortController.signal,
            onEvent: (event, data) => {
              if (event === GIFT_CARD_AI_SSE_PROGRESS) {
                const payload = data as GiftCardAiProgressPayload | undefined;
                if (!payload) return;

                const label =
                  payload.labelKey && tAll.has(payload.labelKey)
                    ? String(tAll(payload.labelKey))
                    : payload.label;

                if (!label) return;

                appendLiveStep(assistantId, label);
                noteProgressActivity(assistantId);
                return;
              }

              if (event === GIFT_CARD_AI_SSE_ASK_USER) {
                const payload = data as GiftCardAiAskUserPayload | undefined;
                if (!payload) return;

                patchAssistant(assistantId, {
                  askUser: payload,
                  askUserAnswered: false,
                });

                return;
              }

              if (event === GIFT_CARD_AI_SSE_DELTA) {
                const payload = data as GiftCardAiDeltaPayload | undefined;
                if (!payload?.text) return;

                if (looksLikeJsonPayload(payload.text)) return;

                noteProgressActivity(assistantId);
                setMessages((current) =>
                  current.map((message) =>
                    message.id === assistantId
                      ? {
                          ...message,
                          content: `${message.content}${payload.text}`,
                          segments: appendTextSegment(
                            message.segments,
                            payload.text,
                          ),
                        }
                      : message,
                  ),
                );
              }
            },
          },
        );

        if (result.status === "waiting_for_user") {
          clearIdleProgressTimer();
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId
                ? {
                    ...message,
                    askUser: result.askUser,
                    askUserAnswered: false,
                    content: result.text?.trim() || message.content,
                    segments: keepDisplaySegments(message.segments),
                  }
                : message,
            ),
          );

          return;
        }

        const proposalResult = result.proposal;
        const summary =
          proposalResult.summary?.trim() || t("designer.ai.summaryFallback");

        setMessages((current) =>
          current.map((message) => {
            if (message.id !== assistantId) return message;

            const finalized = finalizeAssistantSegments(
              message.segments,
              summary,
            );

            return {
              ...message,
              proposal: proposalResult,
              content: finalized.content,
              segments: finalized.segments,
            };
          }),
        );

        await applyProposal(assistantId, proposalResult);
      } catch (err: any) {
        if (
          (err instanceof DOMException && err.name === "AbortError") ||
          (err instanceof Error && err.name === "AbortError")
        ) {
          return;
        }

        patchAssistant(assistantId, {
          error: err?.message || t("designer.ai.errorGeneric"),
          segments: keepDisplaySegments(
            messages.find((message) => message.id === assistantId)?.segments,
          ),
        });
      } finally {
        clearIdleProgressTimer();

        if (liveAssistantIdRef.current === assistantId) {
          liveAssistantIdRef.current = null;
        }

        if (abortRef.current === abortController) {
          abortRef.current = null;
        }

        setLoading(false);
      }
    },
    [
      appendLiveStep,
      appId,
      applyProposal,
      beginProgress,
      clearIdleProgressTimer,
      designId,
      draft,
      form,
      messages,
      noteProgressActivity,
      patchAssistant,
      quickActions,
      t,
      tAll,
    ],
  );

  const onSubmit = useCallback(() => {
    void runAction("custom_instruction", draft);
  }, [draft, runAction]);

  const onStop = useCallback(() => {
    clearIdleProgressTimer();
    liveAssistantIdRef.current = null;
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
  }, [clearIdleProgressTimer]);

  const retryFromMessage = useCallback(
    async (assistantMessageId: string) => {
      if (loading || disabled) return;

      const assistantIndex = messages.findIndex(
        (message) => message.id === assistantMessageId,
      );

      if (assistantIndex < 0) return;

      let latestAssistantIndex = -1;

      for (let index = messages.length - 1; index >= 0; index -= 1) {
        if (messages[index]?.role === "assistant") {
          latestAssistantIndex = index;
          break;
        }
      }

      if (assistantIndex !== latestAssistantIndex) return;

      const assistantMessage = messages[assistantIndex]!;
      let userIndex = assistantIndex - 1;

      while (userIndex >= 0 && messages[userIndex]?.role !== "user") {
        userIndex -= 1;
      }

      const userMessage = userIndex >= 0 ? messages[userIndex] : null;
      if (!userMessage?.actionId) return;

      if (assistantMessage.designBeforeApply) {
        replaceDesign(assistantMessage.designBeforeApply);
      }

      if (typeof assistantMessage.nameBeforeApply === "string") {
        form.setValue("name", assistantMessage.nameBeforeApply, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      setMessages(messages.slice(0, userIndex));
      await runAction(
        userMessage.actionId,
        userMessage.instruction || undefined,
        {
          replyToQuestion: userMessage.replyToQuestion ?? null,
        },
      );
    },
    [disabled, form, loading, messages, replaceDesign, runAction],
  );

  const onAnswerAskUser = useCallback(
    (messageId: string, answer: string) => {
      patchAssistant(messageId, { askUserAnswered: true });
      void runAction("custom_instruction", answer, {
        replyToQuestion: answer,
      });
    },
    [patchAssistant, runAction],
  );

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="border-border flex shrink-0 flex-wrap gap-1 border-b p-2">
        {quickActions.map((action) => (
          <Button
            key={action.id}
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 shrink-0 px-2 text-xs"
            disabled={loading || disabled}
            onClick={() => void runAction(action.id)}
          >
            {action.label}
          </Button>
        ))}
      </div>

      <AiChatShell
        className="min-h-0 flex-1 px-1"
        title={
          <>
            <Sparkles className="size-4" />
            {t("designer.ai.title")}
          </>
        }
        isEmpty={messages.length === 0 && !loading}
        emptyHint={t("designer.ai.panelHint")}
        scrollDeps={[messages, loading]}
        messages={messages.map((message, index) => {
          const isLatestAssistant =
            message.role === "assistant" &&
            !messages
              .slice(index + 1)
              .some((entry) => entry.role === "assistant");

          return (
            <AiMessageBubble
              key={message.id}
              message={message}
              thinkingActive={loading && isLatestAssistant}
              elapsedLabel={formatElapsed(elapsedMs)}
              onAnswerAskUser={onAnswerAskUser}
              askUserDisabled={loading || disabled}
              actions={
                isLatestAssistant && !loading ? (
                  <AiActionLink
                    disabled={disabled}
                    onClick={() => void retryFromMessage(message.id)}
                  >
                    <RotateCcw className="size-3" />
                    {t("designer.ai.retry")}
                  </AiActionLink>
                ) : null
              }
            >
              {message.error ? (
                <p className="mt-2 text-[12px] text-destructive" role="alert">
                  {message.error}
                </p>
              ) : null}
              {message.applied ? (
                <p className="text-muted-foreground mt-2 text-[11px] font-medium">
                  {t("designer.ai.applied")}
                </p>
              ) : null}
            </AiMessageBubble>
          );
        })}
        composer={
          <AiComposer
            value={draft}
            onChange={setDraft}
            onSubmit={onSubmit}
            onStop={onStop}
            loading={loading}
            disabled={disabled}
            placeholder={t("designer.ai.placeholder")}
            className="px-0"
          />
        }
      />
    </div>
  );
}
