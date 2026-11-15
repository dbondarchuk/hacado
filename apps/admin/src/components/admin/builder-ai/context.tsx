"use client";

import {
  applyDocumentProposal,
  computeDocumentRevision,
  type BuilderDocumentSettings,
  type DocumentProposal,
  type DocumentSettingsProposal,
} from "@hacado/builder-ai/client";
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
} from "./types";

const PROGRESS_STEPS_CORE = [
  "Understanding your request…",
  "Inspecting the document…",
  "Drafting a response…",
  "Preparing proposed changes…",
];

/** Looped after the core steps while the request is still running. */
const PROGRESS_STEPS_FILLER = [
  "Double-checking the layout…",
  "Polishing the wording…",
  "Making sure styles still make sense…",
  "Counting the pixels (not really)…",
  "Asking the blocks to cooperate…",
  "Negotiating with stubborn margins…",
  "Herding runaway line breaks…",
  "Almost there — tying up loose ends…",
  "Still thinking — good ideas take a second…",
  "Consulting the design spirits…",
  "Warming up the Mustache variables…",
  "Convincing the hero not to steal the show…",
];

const PROGRESS_MAX_VISIBLE = 12;

type QuickActionOptions = {
  /** When false, do not attach the selected block (document-level actions). */
  attachSelection?: boolean;
};

type BuilderAIActions = {
  run: (message: string, actionId?: string) => Promise<void>;
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

const actionsBridge: { current: BuilderAIActions | null } = { current: null };

function setBuilderAIActions(actions: BuilderAIActions | null) {
  actionsBridge.current = actions;
}

function formatApplyFailureReason(result: {
  reason: string;
  issues?: string[];
}): BuilderAIApplyError {
  if (result.reason === "stale_revision") {
    return {
      message: "Applying AI changes failed",
      details:
        "Document changed while AI was working. Re-run the action or apply again.",
    };
  }

  if (result.reason === "invalid_operations") {
    return {
      message: "Applying AI changes failed",
      details: (result.issues ?? ["No valid editor operations to apply"]).join(
        "\n",
      ),
    };
  }

  return {
    message: "Applying AI changes failed",
    details: result.reason,
  };
}

function toApplyError(error: unknown): BuilderAIApplyError {
  if (error instanceof Error) {
    return {
      message: "Applying AI changes failed",
      details: [error.name, error.message, error.stack]
        .filter(Boolean)
        .join("\n"),
    };
  }

  return {
    message: "Applying AI changes failed",
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
  const t = useI18n();
  const setSidebarTab = useSetSidebarTab();
  const openInspectorDrawer = useOpenInspectorDrawer();
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressStepsRef = useRef<string[]>([]);

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
        label = t.has(displayName as any)
          ? String(t(displayName as any))
          : displayName;
      }

      return { id: blockId, type, label };
    },
    [editorStore, t],
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

  const clearProgress = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    progressStepsRef.current = [];
    setProgressSteps([]);
  }, [setProgressSteps]);

  const startProgress = useCallback(() => {
    clearProgress();
    const initial = [PROGRESS_STEPS_CORE[0]!];
    progressStepsRef.current = initial;
    setProgressSteps(initial);
    let index = 0;

    progressTimerRef.current = setInterval(() => {
      index += 1;

      const label =
        index < PROGRESS_STEPS_CORE.length
          ? PROGRESS_STEPS_CORE[index]!
          : PROGRESS_STEPS_FILLER[
              (index - PROGRESS_STEPS_CORE.length) %
                PROGRESS_STEPS_FILLER.length
            ]!;

      const prev = progressStepsRef.current;
      let next: string[];

      if (prev.length < PROGRESS_MAX_VISIBLE) {
        next = [...prev, label];
      } else {
        // Keep the real core steps; rotate funny fillers in the tail.
        next = [
          ...prev.slice(0, PROGRESS_STEPS_CORE.length),
          ...prev.slice(PROGRESS_STEPS_CORE.length + 1),
          label,
        ];
      }

      progressStepsRef.current = next;
      setProgressSteps(next);
    }, 1800);
  }, [clearProgress, setProgressSteps]);

  const applyProposalSafely = useCallback(
    (nextProposal: DocumentProposal) => {
      if (!document) {
        setApplyError({
          message: "Applying AI changes failed",
          details: "Document is not ready",
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
          setApplyError(formatApplyFailureReason(result));
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
        setApplyError(toApplyError(err));
        return { ok: false as const, reason: "empty" as const };
      }
    },
    [dispatch, document, setApplyError],
  );

  const applySettingsProposalSafely = useCallback(
    (next: DocumentSettingsProposal) => {
      const currentSlug =
        useBuilderAIStore.getState().config?.documentSettings?.slug;

      const { slug, ...rest } = next.settings;
      const immediate: Partial<BuilderDocumentSettings> = { ...rest };

      if (Object.keys(immediate).length) {
        useBuilderAIStore.getState().applyDocumentSettings(immediate);
      }

      const pendingSlug =
        typeof slug === "string" && slug.trim() && slug.trim() !== currentSlug
          ? slug.trim()
          : null;

      return {
        applied: immediate,
        pendingSlug,
      };
    },
    [],
  );

  const run = useCallback(
    async (
      message: string,
      actionId?: string,
      attachmentOverride?: AttachedBlock | null,
    ) => {
      if (!document) {
        setApplyError({
          message: "AI request failed",
          details: "Document is not ready",
        });

        return;
      }

      const trimmed = message.trim();

      if (!trimmed) return;

      openPanel();
      setLoading(true);
      setApplyError(null);
      startProgress();

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
      const userMessage: BuilderAIChatMessage = {
        id: createId(),
        role: "user",
        content: trimmed,
        attachedBlock: attachment,
        createdAt: Date.now(),
      };

      setMessages((current) => [...current, userMessage]);
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
          selection: {
            builder: props.builder,
            documentId: props.documentId,
            documentRevision,
            selectionType: selectedBlockIds.length ? "block" : "document",
            selectedBlockIds,
            selectedBlockTypes: attachment ? [attachment.type] : [],
            selectedSlot: null,
          },
        });

        setConversationId(response.conversationId);

        const completedSteps =
          progressStepsRef.current.length > 0
            ? [...progressStepsRef.current]
            : PROGRESS_STEPS_CORE.slice(0, 2);

        let pendingSlug: string | null = null;

        if (response.settingsProposal) {
          pendingSlug = applySettingsProposalSafely(
            response.settingsProposal,
          ).pendingSlug;
        }

        const assistantMessage: BuilderAIChatMessage = {
          id: createId(),
          role: "assistant",
          content: response.text,
          steps: completedSteps,
          proposal: response.proposal ?? null,
          settingsProposal: response.settingsProposal ?? null,
          pendingSlug,
          createdAt: Date.now(),
        };

        setMessages((current) => [
          ...current.map((message) =>
            message.documentBeforeApply
              ? { ...message, documentBeforeApply: undefined }
              : message,
          ),
          assistantMessage,
        ]);

        if (response.proposal?.operations.length) {
          const documentBeforeApply = JSON.parse(JSON.stringify(document));
          const applied = applyProposalSafely(response.proposal);

          if (!applied.ok) {
            const failure = formatApplyFailureReason(applied as any);

            setMessages((current) => {
              const next = [...current];
              const last = next[next.length - 1];

              if (last?.role === "assistant") {
                next[next.length - 1] = { ...last, applyError: failure };
              }

              return next;
            });
          } else {
            setMessages((current) => {
              const next = [...current];
              const last = next[next.length - 1];

              if (last?.role === "assistant") {
                next[next.length - 1] = { ...last, documentBeforeApply };
              }

              return next;
            });
          }
        }
      } catch (err) {
        const failure = {
          message: "AI request failed",
          details: err instanceof Error ? err.message : String(err),
        };

        setApplyError(failure);
        setMessages((current) => [
          ...current,
          {
            id: createId(),
            role: "assistant",
            content: "Something went wrong while contacting Builder AI.",
            applyError: failure,
            createdAt: Date.now(),
          },
        ]);
      } finally {
        clearProgress();
        setLoading(false);
      }
    },
    [
      applyProposalSafely,
      applySettingsProposalSafely,
      clearProgress,
      document,
      editorArgs,
      openPanel,
      props.apps,
      props.builder,
      props.documentId,
      setApplyError,
      setAttachedBlock,
      setConversationId,
      setDraft,
      setLoading,
      setMessages,
      startProgress,
    ],
  );

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
      run: (message, actionId) => run(message, actionId),
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
