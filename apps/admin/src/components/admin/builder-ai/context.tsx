"use client";

import {
  applyDocumentProposal,
  computeDocumentRevision,
  type BuilderDocumentSettings,
  type DocumentProposal,
  type DocumentSettingsProposal,
} from "@hacado/ai-builder-core/client";
import {
  beginDocumentApply,
  clearDocumentApply,
  commitDocumentApply,
  subscribeDocumentApplyFailures,
  useDispatchAction,
  useDocument,
  useEditorArgs,
  useEditorStateStore,
  useOpenInspectorDrawer,
  useSelectedBlockId,
  useSelectedBlockType,
  useSetSelectedBlockId,
  useSetSidebarTab,
} from "@hacado/builder/editor";
import { useI18n } from "@hacado/i18n/client";
import { useCallback, useEffect, useRef } from "react";
import { useStore } from "zustand";
import { runBuilderAIChat } from "./api";
import type { BuilderAIApplyError } from "./apply-error";
import { useBuilderAIStore, type BuilderAIConfig } from "./store";
import {
  BUILDER_AI_TAB,
  type AttachedBlock,
  type BuilderAIChatMessage,
  type BuilderAIStreamSegment,
} from "./types";

const PROGRESS_MAX_VISIBLE = 12;
const PROGRESS_IDLE_MS = 5_000;

const PROGRESS_FILLER_KEYS = [
  "drafting",
  "preparing",
  "doubleChecking",
  "polishing",
  "styles",
  "pixels",
  "blocks",
  "margins",
  "lineBreaks",
  "looseEnds",
  "stillThinking",
  "spirits",
  "mustache",
  "hero",
] as const;

function appendStepSegment(
  segments: BuilderAIStreamSegment[],
  label: string,
): BuilderAIStreamSegment[] {
  const last = segments[segments.length - 1];

  if (last?.type === "steps") {
    if (last.steps[last.steps.length - 1] === label) return segments;

    return [
      ...segments.slice(0, -1),
      { type: "steps", steps: [...last.steps, label] },
    ];
  }

  return [...segments, { type: "steps", steps: [label] }];
}

function appendTextSegment(
  segments: BuilderAIStreamSegment[],
  text: string,
): BuilderAIStreamSegment[] {
  if (!text) return segments;

  const last = segments[segments.length - 1];

  if (last?.type === "text") {
    return [
      ...segments.slice(0, -1),
      { type: "text", text: `${last.text}${text}` },
    ];
  }

  return [...segments, { type: "text", text }];
}

function flattenSegmentSteps(segments: BuilderAIStreamSegment[]): string[] {
  return segments.flatMap((segment) =>
    segment.type === "steps" ? segment.steps : [],
  );
}

function finalizeSegmentsWithSummary(
  segments: BuilderAIStreamSegment[],
  summary: string,
): BuilderAIStreamSegment[] {
  const trimmed = summary.trim();

  if (!trimmed) return segments;

  const withoutTrailingEmptyText = [...segments];

  while (withoutTrailingEmptyText.length) {
    const last = withoutTrailingEmptyText[withoutTrailingEmptyText.length - 1];

    if (last?.type === "text" && !last.text.trim()) {
      withoutTrailingEmptyText.pop();
      continue;
    }

    break;
  }

  const last = withoutTrailingEmptyText[withoutTrailingEmptyText.length - 1];

  if (last?.type === "text") {
    if (last.text.trim() === trimmed) return withoutTrailingEmptyText;

    // Keep earlier plan text; append the done summary as its own segment.
    if (last.text.trim() && last.text.trim() !== trimmed) {
      return [...withoutTrailingEmptyText, { type: "text", text: trimmed }];
    }

    return [
      ...withoutTrailingEmptyText.slice(0, -1),
      { type: "text", text: trimmed },
    ];
  }

  return [...withoutTrailingEmptyText, { type: "text", text: trimmed }];
}

type Translate = {
  (key: string): string;
  (key: string, values: Record<string, unknown>): string;
};

type QuickActionOptions = {
  /** When false, do not attach the selected block (document-level actions). */
  attachSelection?: boolean;
};

type BuilderAIActions = {
  run: (
    message: string,
    actionId?: string,
    attachmentOverride?: AttachedBlock | null,
    options?: { replyToQuestion?: string },
  ) => Promise<void>;
  stop: () => void;
  retryFromMessage: (assistantMessageId: string) => Promise<void>;
  runQuickAction: (
    label: string,
    actionId: string,
    options?: QuickActionOptions,
  ) => Promise<void>;
  openCustomInPanel: () => void;
  applyProposal: (proposal: DocumentProposal, messageId?: string) => void;
  attachSelectedBlock: () => void;
  clearAttachedBlock: () => void;
};

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

const actionsBridge: { current: BuilderAIActions | null } = { current: null };

function setBuilderAIActions(actions: BuilderAIActions | null) {
  actionsBridge.current = actions;
}

function formatApplyFailureReason(
  result: {
    reason: string;
    issues?: string[];
  },
  t: Translate,
): BuilderAIApplyError {
  if (result.reason === "stale_revision") {
    return {
      message: t("ai.applyFailed"),
      details: t("ai.staleDocument"),
    };
  }

  if (result.reason === "invalid_operations") {
    return {
      message: t("ai.applyFailed"),
      details: (result.issues ?? [t("ai.noValidOperations")]).join("\n"),
    };
  }

  return {
    message: t("ai.applyFailed"),
    details: result.reason,
  };
}

function toApplyError(error: unknown, t: Translate): BuilderAIApplyError {
  if (error instanceof Error) {
    return {
      message: t("ai.applyFailed"),
      details: [error.name, error.message, error.stack]
        .filter(Boolean)
        .join("\n"),
    };
  }

  return {
    message: t("ai.applyFailed"),
    details: String(error),
  };
}

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const MAX_HISTORY_MESSAGES = 12;

function toConversationHistory(
  messages: BuilderAIChatMessage[],
): Array<{ role: "user" | "assistant"; content: string }> {
  return messages
    .filter((message) => message.content.trim().length > 0)
    .slice(-MAX_HISTORY_MESSAGES)
    .map((message) => {
      if (message.role === "user" && message.attachedBlock) {
        return {
          role: "user" as const,
          content: `[Attached block: ${message.attachedBlock.label} · ${message.attachedBlock.id}]\n${message.content}`,
        };
      }

      return {
        role: message.role,
        content: message.content,
      };
    });
}

function ensureConversationId(): string {
  const existing = useBuilderAIStore.getState().conversationId;

  if (existing) return existing;

  const next =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : createId();

  useBuilderAIStore.getState().setConversationId(next);
  return next;
}

/** Always-mounted runtime: owns chat actions and open-panel bridge. */
export function BuilderAIRuntime(props: BuilderAIConfig) {
  const document = useDocument();
  const editorArgs = useEditorArgs();
  const selectedBlockId = useSelectedBlockId();
  const dispatch = useDispatchAction();
  const editorStore = useEditorStateStore();
  const t = useI18n("builder");
  const tAll = useI18n();
  const setSidebarTab = useSetSidebarTab();
  const openInspectorDrawer = useOpenInspectorDrawer();
  // Real SSE steps + idle filler when nothing new arrives for a bit.
  const progressStepsRef = useRef<string[]>([]);
  const liveSegmentsRef = useRef<BuilderAIStreamSegment[]>([]);
  const progressIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const progressFillerIndexRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const liveAssistantIdRef = useRef<string | null>(null);

  const setConfig = useBuilderAIStore((s) => s.setConfig);
  const registerOpenPanel = useBuilderAIStore((s) => s.registerOpenPanel);
  const openPanel = useBuilderAIStore((s) => s.openPanel);
  const setLoading = useBuilderAIStore((s) => s.setLoading);
  const setProgressSteps = useBuilderAIStore((s) => s.setProgressSteps);
  const setMessages = useBuilderAIStore((s) => s.setMessages);
  const setDraft = useBuilderAIStore((s) => s.setDraft);
  const setAttachedBlock = useBuilderAIStore((s) => s.setAttachedBlock);
  const setConversationId = useBuilderAIStore((s) => s.setConversationId);
  const setApplyError = useBuilderAIStore((s) => s.setApplyError);

  useEffect(() => {
    setConfig({
      builder: props.builder,
      documentId: props.documentId,
      apps: props.apps,
      documentSettings: props.documentSettings,
    });
  }, [
    props.apps,
    props.builder,
    props.documentId,
    props.documentSettings,
    setConfig,
  ]);

  useEffect(() => {
    return registerOpenPanel(() => {
      setSidebarTab(BUILDER_AI_TAB);
      openInspectorDrawer();
    });
  }, [openInspectorDrawer, registerOpenPanel, setSidebarTab]);

  const resolveBlockLabel = useCallback(
    (blockId: string): AttachedBlock => {
      const state = editorStore.getState();
      const entry = state.indexes[blockId];

      if (!entry) {
        return { id: blockId, type: "Unknown", label: blockId };
      }

      const type = entry.block.type;
      const displayName = state.blocks[type]?.displayName;
      let label = type;

      if (typeof displayName === "string") {
        label = tAll.has(displayName as any)
          ? String(tAll(displayName as any))
          : displayName;
      }

      return { id: blockId, type, label };
    },
    [editorStore, tAll],
  );

  const attachBlockById = useCallback(
    (blockId: string | null | undefined) => {
      if (!blockId) {
        setAttachedBlock(null);
        return;
      }

      setAttachedBlock(resolveBlockLabel(blockId));
    },
    [resolveBlockLabel, setAttachedBlock],
  );

  useEffect(() => {
    return subscribeDocumentApplyFailures((failure) => {
      setApplyError({
        message: failure.message,
        details: failure.details,
      });

      setMessages((current) => {
        const next = [...current];

        for (let i = next.length - 1; i >= 0; i -= 1) {
          if (next[i]?.role === "assistant") {
            next[i] = {
              ...next[i]!,
              applyError: {
                message: failure.message,
                details: failure.details,
              },
            };

            break;
          }
        }

        return next;
      });
    });
  }, [setApplyError, setMessages]);

  const clearIdleProgressTimer = useCallback(() => {
    if (progressIdleTimerRef.current) {
      clearTimeout(progressIdleTimerRef.current);
      progressIdleTimerRef.current = null;
    }
  }, []);

  const clearProgress = useCallback(() => {
    clearIdleProgressTimer();
    progressStepsRef.current = [];
    progressFillerIndexRef.current = 0;
    setProgressSteps([]);
  }, [clearIdleProgressTimer, setProgressSteps]);

  const syncLiveAssistantProgress = useCallback(() => {
    const liveId = liveAssistantIdRef.current;

    if (!liveId) return;

    setMessages((current) =>
      current.map((message) =>
        message.id === liveId
          ? {
              ...message,
              steps: [...progressStepsRef.current],
              segments: [...liveSegmentsRef.current],
            }
          : message,
      ),
    );
  }, [setMessages]);

  const appendProgressStep = useCallback(
    (label: string) => {
      const prev = progressStepsRef.current;

      if (prev[prev.length - 1] === label) return;

      const next =
        prev.length < PROGRESS_MAX_VISIBLE
          ? [...prev, label]
          : [...prev.slice(1), label];

      progressStepsRef.current = next;
      liveSegmentsRef.current = appendStepSegment(
        liveSegmentsRef.current,
        label,
      );

      setProgressSteps(next);
      syncLiveAssistantProgress();
    },
    [setProgressSteps, syncLiveAssistantProgress],
  );

  const scheduleIdleFiller = useCallback(() => {
    clearIdleProgressTimer();

    progressIdleTimerRef.current = setTimeout(() => {
      const fillers = PROGRESS_FILLER_KEYS.map((key) =>
        t(`ai.progress.${key}`),
      );

      let attempts = 0;
      let label = fillers[progressFillerIndexRef.current % fillers.length]!;

      while (
        attempts < fillers.length &&
        progressStepsRef.current[progressStepsRef.current.length - 1] === label
      ) {
        progressFillerIndexRef.current += 1;
        label = fillers[progressFillerIndexRef.current % fillers.length]!;
        attempts += 1;
      }

      progressFillerIndexRef.current += 1;
      appendProgressStep(label);
      scheduleIdleFiller();
    }, PROGRESS_IDLE_MS);
  }, [appendProgressStep, clearIdleProgressTimer, t]);

  const noteProgressActivity = useCallback(() => {
    scheduleIdleFiller();
  }, [scheduleIdleFiller]);

  const beginProgress = useCallback(() => {
    clearIdleProgressTimer();
    progressFillerIndexRef.current = 0;

    const initial = [t("ai.progress.understanding")];
    progressStepsRef.current = initial;
    liveSegmentsRef.current = [{ type: "steps", steps: [...initial] }];
    setProgressSteps(initial);
    scheduleIdleFiller();
  }, [clearIdleProgressTimer, scheduleIdleFiller, setProgressSteps, t]);

  const resolveToolStepLabel = useCallback(
    (step: { label: string; labelKey?: string }) => {
      if (step.labelKey) {
        const key = `ai.${step.labelKey}` as const;

        if (t.has(key as any)) {
          return String(t(key as any));
        }
      }

      return step.label;
    },
    [t],
  );

  const applyProposalSafely = useCallback(
    (nextProposal: DocumentProposal) => {
      if (!document) {
        setApplyError({
          message: t("ai.applyFailed"),
          details: t("ai.documentNotReady"),
        });

        return { ok: false as const, reason: "empty" as const };
      }

      setApplyError(null);
      beginDocumentApply(document);

      try {
        const result = applyDocumentProposal({
          document,
          expectedRevision: nextProposal.documentRevision,
          operations: nextProposal.operations,
          dispatch,
        });

        if (!result.ok) {
          clearDocumentApply();
          setApplyError(formatApplyFailureReason(result, t));
          return result;
        }

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            commitDocumentApply();
          });
        });

        return result;
      } catch (err) {
        clearDocumentApply();
        setApplyError(toApplyError(err, t));
        return { ok: false as const, reason: "empty" as const };
      }
    },
    [dispatch, document, setApplyError, t],
  );

  const applySettingsProposalSafely = useCallback(
    (next: DocumentSettingsProposal) => {
      const config = useBuilderAIStore.getState().config;
      const currentSlug = config?.documentSettings?.slug;
      const isNewDocument = !config?.documentId;

      const { slug, ...rest } = next.settings;
      const immediate: Partial<BuilderDocumentSettings> = { ...rest };
      const proposedSlug =
        typeof slug === "string" && slug.trim() ? slug.trim() : null;

      const slugChanged = Boolean(proposedSlug) && proposedSlug !== currentSlug;

      // New pages: apply AI slug immediately (locked against title auto-gen).
      // Existing pages: keep slug pending confirmation so links aren't broken.
      if (isNewDocument && slugChanged && proposedSlug) {
        immediate.slug = proposedSlug;
      }

      if (Object.keys(immediate).length || slugChanged) {
        useBuilderAIStore.getState().applyDocumentSettings(immediate, {
          preserveSlug: slugChanged,
        });
      }

      return {
        applied: immediate,
        pendingSlug: !isNewDocument && slugChanged ? proposedSlug : null,
      };
    },
    [],
  );

  const run = useCallback(
    async (
      message: string,
      actionId?: string,
      attachmentOverride?: AttachedBlock | null,
      options?: { replyToQuestion?: string },
    ) => {
      if (!document) {
        setApplyError({
          message: t("ai.requestFailed"),
          details: t("ai.documentNotReady"),
        });

        return;
      }

      const trimmed = message.trim();

      if (!trimmed) return;

      openPanel();
      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      setLoading(true);
      setApplyError(null);
      beginProgress();

      const attachment =
        attachmentOverride === undefined
          ? useBuilderAIStore.getState().attachedBlock
          : attachmentOverride;

      if (attachment) {
        setAttachedBlock(attachment);
      }

      const priorHistory = toConversationHistory(
        useBuilderAIStore.getState().messages,
      );

      const conversationId = ensureConversationId();
      const replyToQuestion = options?.replyToQuestion?.trim() || null;
      const userMessage: BuilderAIChatMessage = {
        id: createId(),
        role: "user",
        content: trimmed,
        attachedBlock: attachment,
        replyToQuestion,
        createdAt: Date.now(),
      };

      const liveAssistantId = createId();
      liveAssistantIdRef.current = liveAssistantId;

      const liveAssistant: BuilderAIChatMessage = {
        id: liveAssistantId,
        role: "assistant",
        content: "",
        steps: [...progressStepsRef.current],
        segments: [...liveSegmentsRef.current],
        createdAt: Date.now(),
      };

      setMessages((current) => [
        ...current.map((message) =>
          message.documentBeforeApply
            ? { ...message, documentBeforeApply: undefined }
            : message,
        ),
        userMessage,
        liveAssistant,
      ]);

      setDraft("");

      try {
        const documentRevision = computeDocumentRevision(document);
        // Only the explicit chat attachment scopes selection — live canvas
        // selection alone does not, so asking about another block still works.
        const selectedBlockIds = attachment ? [attachment.id] : [];

        const response = await runBuilderAIChat({
          builder: props.builder,
          document,
          documentRevision,
          documentId: props.documentId,
          conversationId,
          actionId,
          message: trimmed,
          messages: priorHistory,
          apps: props.apps,
          args: editorArgs,
          documentSettings:
            useBuilderAIStore.getState().config?.documentSettings,
          signal: abortController.signal,
          selection: {
            builder: props.builder,
            documentId: props.documentId,
            documentRevision,
            selectionType: selectedBlockIds.length ? "block" : "document",
            selectedBlockIds,
            selectedBlockTypes: attachment ? [attachment.type] : [],
            selectedSlot: null,
          },
          onStep: (step) => {
            if (step.phase !== "start") return;

            noteProgressActivity();
            appendProgressStep(resolveToolStepLabel(step));
          },
          onTextDelta: (text) => {
            noteProgressActivity();
            liveSegmentsRef.current = appendTextSegment(
              liveSegmentsRef.current,
              text,
            );

            setMessages((current) =>
              current.map((message) =>
                message.id === liveAssistantId
                  ? {
                      ...message,
                      content: `${message.content}${text}`,
                      segments: [...liveSegmentsRef.current],
                    }
                  : message,
              ),
            );
          },
        });

        setConversationId(response.conversationId);

        const completedSegments = finalizeSegmentsWithSummary(
          liveSegmentsRef.current,
          response.text,
        );

        liveSegmentsRef.current = completedSegments;

        const completedSteps =
          flattenSegmentSteps(completedSegments).length > 0
            ? flattenSegmentSteps(completedSegments)
            : progressStepsRef.current.length > 0
              ? [...progressStepsRef.current]
              : [t("ai.progress.understanding")];

        const waitingForUser = response.status === "waiting_for_user";
        let pendingSlug: string | null = null;

        if (!waitingForUser && response.settingsProposal) {
          pendingSlug = applySettingsProposalSafely(
            response.settingsProposal,
          ).pendingSlug;
        }

        setMessages((current) =>
          current.map((message) =>
            message.id === liveAssistantId
              ? {
                  ...message,
                  content: response.text,
                  steps: completedSteps,
                  segments: completedSegments,
                  status: response.status,
                  askUser: response.askUser ?? null,
                  askUserAnswered: false,
                  proposal: waitingForUser ? null : (response.proposal ?? null),
                  settingsProposal: waitingForUser
                    ? null
                    : (response.settingsProposal ?? null),
                  pendingSlug: waitingForUser ? null : pendingSlug,
                }
              : message,
          ),
        );

        if (!waitingForUser && response.proposal?.operations.length) {
          const documentBeforeApply = JSON.parse(JSON.stringify(document));
          const applied = applyProposalSafely(response.proposal);

          if (!applied.ok) {
            const failure = formatApplyFailureReason(applied as any, t);

            setMessages((current) =>
              current.map((message) =>
                message.id === liveAssistantId
                  ? { ...message, applyError: failure }
                  : message,
              ),
            );
          } else {
            setMessages((current) =>
              current.map((message) =>
                message.id === liveAssistantId
                  ? { ...message, documentBeforeApply }
                  : message,
              ),
            );
          }
        }
      } catch (err) {
        if (isAbortError(err)) {
          setMessages((current) =>
            current.filter((message) => {
              if (message.id !== liveAssistantId) return true;

              return Boolean(message.content.trim());
            }),
          );

          return;
        }

        const failure = {
          message: t("ai.requestFailed"),
          details: err instanceof Error ? err.message : String(err),
        };

        setApplyError(failure);
        setMessages((current) =>
          current.map((message) =>
            message.id === liveAssistantId
              ? {
                  ...message,
                  content: message.content.trim() || t("ai.requestFailed"),
                  applyError: failure,
                }
              : message,
          ),
        );
      } finally {
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }

        if (liveAssistantIdRef.current === liveAssistantId) {
          liveAssistantIdRef.current = null;
        }

        clearProgress();
        setLoading(false);
      }
    },
    [
      appendProgressStep,
      applyProposalSafely,
      applySettingsProposalSafely,
      beginProgress,
      clearProgress,
      document,
      editorArgs,
      noteProgressActivity,
      openPanel,
      props.apps,
      props.builder,
      props.documentId,
      resolveToolStepLabel,
      setApplyError,
      setAttachedBlock,
      setConversationId,
      setDraft,
      setLoading,
      setMessages,
      t,
    ],
  );

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    clearProgress();
    setLoading(false);
  }, [clearProgress, setLoading]);

  const runQuickAction = useCallback(
    async (label: string, actionId: string, options?: QuickActionOptions) => {
      const attachSelection = options?.attachSelection !== false;
      const attachment =
        attachSelection && selectedBlockId
          ? resolveBlockLabel(selectedBlockId)
          : null;

      if (attachment) {
        setAttachedBlock(attachment);
      } else if (!attachSelection) {
        setAttachedBlock(null);
      }

      openPanel();
      await run(label, actionId, attachment);
    },
    [openPanel, resolveBlockLabel, run, selectedBlockId, setAttachedBlock],
  );

  const retryFromMessage = useCallback(
    async (assistantMessageId: string) => {
      if (useBuilderAIStore.getState().loading) return;

      const current = useBuilderAIStore.getState().messages;
      const assistantIndex = current.findIndex(
        (message) => message.id === assistantMessageId,
      );

      if (assistantIndex < 0) return;

      let latestAssistantIndex = -1;

      for (let index = current.length - 1; index >= 0; index -= 1) {
        if (current[index]?.role === "assistant") {
          latestAssistantIndex = index;
          break;
        }
      }

      if (assistantIndex !== latestAssistantIndex) return;

      const assistantMessage = current[assistantIndex]!;
      let userIndex = assistantIndex - 1;

      while (userIndex >= 0 && current[userIndex]?.role !== "user") {
        userIndex -= 1;
      }

      const userMessage = userIndex >= 0 ? current[userIndex] : null;

      if (!userMessage) return;

      if (assistantMessage.documentBeforeApply) {
        dispatch({
          type: "document",
          value: { document: assistantMessage.documentBeforeApply },
        });
      }

      setMessages(current.slice(0, userIndex));
      await run(
        userMessage.content,
        undefined,
        userMessage.attachedBlock ?? null,
      );
    },
    [dispatch, run, setMessages],
  );

  const openCustomInPanel = useCallback(() => {
    if (selectedBlockId) {
      attachBlockById(selectedBlockId);
    }

    openPanel();
  }, [attachBlockById, openPanel, selectedBlockId]);

  useEffect(() => {
    setBuilderAIActions({
      run: (message, actionId, attachmentOverride, options) =>
        run(message, actionId, attachmentOverride, options),
      stop,
      retryFromMessage,
      runQuickAction,
      openCustomInPanel,
      applyProposal: (proposal, messageId) => {
        const documentBeforeApply = document
          ? JSON.parse(JSON.stringify(document))
          : undefined;

        const applied = applyProposalSafely(proposal);

        if (!applied.ok || !messageId || !documentBeforeApply) return;

        setMessages((current) =>
          current.map((message) => {
            if (message.id === messageId) {
              return { ...message, documentBeforeApply, applyError: null };
            }

            if (message.documentBeforeApply) {
              return { ...message, documentBeforeApply: undefined };
            }

            return message;
          }),
        );
      },
      attachSelectedBlock: () => {
        attachBlockById(selectedBlockId);
      },
      clearAttachedBlock: () => {
        setAttachedBlock(null);
      },
    });

    return () => setBuilderAIActions(null);
  }, [
    applyProposalSafely,
    attachBlockById,
    document,
    openCustomInPanel,
    retryFromMessage,
    run,
    runQuickAction,
    selectedBlockId,
    setAttachedBlock,
    setMessages,
    stop,
  ]);

  return null;
}

/** Hook used by panel + toolbar menus. */
export function useBuilderAI() {
  const config = useBuilderAIStore((s) => s.config);
  const loading = useBuilderAIStore((s) => s.loading);
  const progressSteps = useBuilderAIStore((s) => s.progressSteps);
  const messages = useBuilderAIStore((s) => s.messages);
  const draft = useBuilderAIStore((s) => s.draft);
  const attachedBlock = useBuilderAIStore((s) => s.attachedBlock);
  const conversationId = useBuilderAIStore((s) => s.conversationId);
  const applyError = useBuilderAIStore((s) => s.applyError);
  const setDraft = useBuilderAIStore((s) => s.setDraft);
  const clearApplyError = useBuilderAIStore((s) => s.clearApplyError);
  const openPanel = useBuilderAIStore((s) => s.openPanel);
  const discardProposal = useBuilderAIStore((s) => s.discardProposal);
  const updateMessage = useBuilderAIStore((s) => s.updateMessage);
  const applyDocumentSettings = useBuilderAIStore(
    (s) => s.applyDocumentSettings,
  );

  const selectedBlockId = useSelectedBlockId();
  const selectedBlockType = useSelectedBlockType();
  const setSelectedBlockId = useSetSelectedBlockId();

  return {
    builder: config?.builder ?? ("page" as const),
    documentId: config?.documentId,
    apps: config?.apps,
    loading,
    progressSteps,
    messages,
    draft,
    setDraft,
    attachedBlock,
    conversationId,
    applyError,
    clearApplyError,
    openPanel,
    selectedBlockId,
    selectedBlockType: selectedBlockType
      ? String(selectedBlockType)
      : undefined,
    focusAttachedBlock: () => {
      if (attachedBlock) setSelectedBlockId(attachedBlock.id);
    },
    focusBlock: (blockId: string) => setSelectedBlockId(blockId),
    attachSelectedBlock: () => {
      actionsBridge.current?.attachSelectedBlock();
    },
    clearAttachedBlock: () => {
      actionsBridge.current?.clearAttachedBlock();
    },
    run: async (message: string, actionId?: string) => {
      await actionsBridge.current?.run(message, actionId);
    },
    stop: () => {
      actionsBridge.current?.stop();
    },
    retryFromMessage: async (assistantMessageId: string) => {
      await actionsBridge.current?.retryFromMessage(assistantMessageId);
    },
    runQuickAction: async (
      label: string,
      actionId: string,
      options?: QuickActionOptions,
    ) => {
      await actionsBridge.current?.runQuickAction(label, actionId, options);
    },
    openCustomInPanel: () => {
      actionsBridge.current?.openCustomInPanel();
    },
    applyProposal: (proposal: DocumentProposal, messageId?: string) => {
      actionsBridge.current?.applyProposal(proposal, messageId);
    },
    confirmPendingSlug: (messageId: string) => {
      const message = useBuilderAIStore
        .getState()
        .messages.find((entry) => entry.id === messageId);

      const slug = message?.pendingSlug?.trim();

      if (!slug) return;

      applyDocumentSettings({ slug });
      updateMessage(messageId, { pendingSlug: null });
    },
    dismissPendingSlug: (messageId: string) => {
      updateMessage(messageId, { pendingSlug: null });
    },
    answerAskUser: (messageId: string, answer: string) => {
      const trimmed = answer.trim();

      if (!trimmed || useBuilderAIStore.getState().loading) return;

      const question = useBuilderAIStore
        .getState()
        .messages.find((entry) => entry.id === messageId)
        ?.askUser?.question?.trim();

      updateMessage(messageId, { askUserAnswered: true });
      void actionsBridge.current?.run(
        trimmed,
        undefined,
        undefined,
        question ? { replyToQuestion: question } : undefined,
      );
    },
    skipAskUser: (messageId: string) => {
      if (useBuilderAIStore.getState().loading) return;

      const question = useBuilderAIStore
        .getState()
        .messages.find((entry) => entry.id === messageId)
        ?.askUser?.question?.trim();

      updateMessage(messageId, { askUserAnswered: true });
      void actionsBridge.current?.run(
        "Skipped",
        undefined,
        undefined,
        question ? { replyToQuestion: question } : undefined,
      );
    },
    discardProposal,
  };
}

export function useBuilderAIContext() {
  return useBuilderAI();
}

export function useAttachedBlockLabel(blockId: string | null | undefined) {
  const store = useEditorStateStore();
  const t = useI18n();

  return useStore(store, (state) => {
    if (!blockId) return null;

    const entry = state.indexes[blockId];

    if (!entry) return blockId;

    const displayName = state.blocks[entry.block.type]?.displayName;

    if (typeof displayName === "string" && t.has(displayName as any)) {
      return String(t(displayName as any));
    }

    return typeof displayName === "string" ? displayName : entry.block.type;
  });
}
