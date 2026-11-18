"use client";

import {
  computeDocumentRevision,
  type BuilderDocumentSettings,
  type DocumentSettingsProposal,
} from "@hacado/ai-builder-core/client";
import { TEXT_MESSAGE_AI_SENTINEL_DOCUMENT } from "@hacado/ai-builder-text-message";
import type { AllKeys } from "@hacado/i18n";
import { useI18n } from "@hacado/i18n/client";
import { Button } from "@hacado/ui/button";
import { cn } from "@hacado/ui/cn";
import { DropdownMenuItem } from "@hacado/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@hacado/ui/sheet";
import { SplitButton } from "@hacado/ui/split-button";
import { Sparkles, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  fetchBuilderAICapabilities,
  runBuilderAIChat,
  type BuilderAIDocumentAction,
} from "./api";
import { BuilderAIAssistantPanel } from "./assistant-panel";
import { registerBuilderAIActions, useBuilderAI } from "./context";
import { useBuilderAIStore } from "./store";
import type { BuilderAIChatMessage, BuilderAIStreamSegment } from "./types";

const AI_DOCK_MIN_WIDTH = 1024;

function useAiDockBeside() {
  const [dockBeside, setDockBeside] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(`(min-width: ${AI_DOCK_MIN_WIDTH}px)`);
    const sync = () => setDockBeside(media.matches);

    sync();
    media.addEventListener("change", sync);

    return () => media.removeEventListener("change", sync);
  }, []);

  return dockBeside;
}

type I18nT = {
  (key: AllKeys, args?: Record<string, any>): string;
  has: (key: string) => boolean;
};

type ResolvedAction = {
  id: string;
  label: string;
  message: string;
};

const PROGRESS_MAX_VISIBLE = 12;
const PROGRESS_IDLE_MS = 5_000;

const PROGRESS_FILLER_KEYS = [
  "drafting",
  "preparing",
  "polishing",
  "mustache",
  "looseEnds",
  "stillThinking",
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
  const withoutTrailingEmptyText = [...segments];

  while (withoutTrailingEmptyText.length) {
    const last = withoutTrailingEmptyText[withoutTrailingEmptyText.length - 1];

    if (last?.type === "text" && !last.text.trim()) {
      withoutTrailingEmptyText.pop();
      continue;
    }

    break;
  }

  if (!summary.trim()) return withoutTrailingEmptyText;

  return [...withoutTrailingEmptyText, { type: "text", text: summary }];
}

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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

function toConversationHistory(
  messages: BuilderAIChatMessage[],
): Array<{ role: "user" | "assistant"; content: string }> {
  return messages
    .filter((message) => message.content.trim().length > 0)
    .slice(-12)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}

function resolveActionLabel(
  t: I18nT,
  action: { labelKey: string; label?: string },
): string {
  if (t.has(action.labelKey)) {
    return String(t(action.labelKey as AllKeys));
  }

  return action.label || action.labelKey;
}

function mapDocumentAction(
  t: I18nT,
  action: BuilderAIDocumentAction,
): ResolvedAction {
  const label = resolveActionLabel(t, action);

  return {
    id: action.id,
    label,
    message: actionMessages[action.id] ?? action.label ?? label,
  };
}

const actionMessages: Record<string, string> = {
  shorten: "Shorten this text message while keeping Mustache variables.",
  rewrite:
    "Rewrite this text message for clarity while keeping Mustache variables.",
  friendlier:
    "Make this text message friendlier while keeping Mustache variables.",
  make_professional:
    "Make this text message more professional while keeping Mustache variables.",
  ensure_variables:
    "Update this text message to use Mustache template variables from getTemplateArgs instead of hard-coded sample values.",
};

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

export type TextMessageAIRuntimeProps = {
  documentId?: string;
  args?: Record<string, unknown>;
  documentSettings?: BuilderDocumentSettings;
};

/** Settings-only AI runtime for SMS templates (no block editor). */
export function TextMessageAIRuntime(props: TextMessageAIRuntimeProps) {
  const t = useI18n("builder");
  const tAll = useI18n();
  const progressStepsRef = useRef<string[]>([]);
  const liveSegmentsRef = useRef<BuilderAIStreamSegment[]>([]);
  const progressIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const progressFillerIndexRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const liveAssistantIdRef = useRef<string | null>(null);

  const setConfig = useBuilderAIStore((s) => s.setConfig);
  const setLoading = useBuilderAIStore((s) => s.setLoading);
  const setProgressSteps = useBuilderAIStore((s) => s.setProgressSteps);
  const setMessages = useBuilderAIStore((s) => s.setMessages);
  const setDraft = useBuilderAIStore((s) => s.setDraft);
  const setApplyError = useBuilderAIStore((s) => s.setApplyError);
  const openPanel = useBuilderAIStore((s) => s.openPanel);
  const setEditorSelection = useBuilderAIStore((s) => s.setEditorSelection);

  useEffect(() => {
    setConfig({
      builder: "text-message",
      documentId: props.documentId,
      documentSettings: props.documentSettings,
    });
  }, [props.documentId, props.documentSettings, setConfig]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    setEditorSelection({ selectedBlockId: null, selectedBlockType: null });
  }, [setEditorSelection]);

  const clearIdleProgressTimer = useCallback(() => {
    if (progressIdleTimerRef.current) {
      clearTimeout(progressIdleTimerRef.current);
      progressIdleTimerRef.current = null;
    }
  }, []);

  const clearProgress = useCallback(() => {
    clearIdleProgressTimer();
    progressStepsRef.current = [];
    liveSegmentsRef.current = [];
    progressFillerIndexRef.current = 0;
    setProgressSteps([]);
  }, [clearIdleProgressTimer, setProgressSteps]);

  const scheduleIdleFiller = useCallback(() => {
    clearIdleProgressTimer();
    progressIdleTimerRef.current = setTimeout(() => {
      const key =
        PROGRESS_FILLER_KEYS[
          progressFillerIndexRef.current % PROGRESS_FILLER_KEYS.length
        ];

      progressFillerIndexRef.current += 1;
      const label = t(`ai.progress.${key}` as any);
      progressStepsRef.current = [
        ...progressStepsRef.current.slice(-(PROGRESS_MAX_VISIBLE - 1)),
        label,
      ];

      liveSegmentsRef.current = appendStepSegment(
        liveSegmentsRef.current,
        label,
      );

      setProgressSteps([...progressStepsRef.current]);
      scheduleIdleFiller();
    }, PROGRESS_IDLE_MS);
  }, [clearIdleProgressTimer, setProgressSteps, t]);

  const beginProgress = useCallback(() => {
    clearProgress();
    const label = t("ai.progress.understanding");
    progressStepsRef.current = [label];
    liveSegmentsRef.current = appendStepSegment([], label);
    setProgressSteps([label]);
    scheduleIdleFiller();
  }, [clearProgress, scheduleIdleFiller, setProgressSteps, t]);

  const noteProgressActivity = useCallback(() => {
    scheduleIdleFiller();
  }, [scheduleIdleFiller]);

  const appendProgressStep = useCallback(
    (label: string) => {
      progressStepsRef.current = [
        ...progressStepsRef.current.slice(-(PROGRESS_MAX_VISIBLE - 1)),
        label,
      ];

      liveSegmentsRef.current = appendStepSegment(
        liveSegmentsRef.current,
        label,
      );

      setProgressSteps([...progressStepsRef.current]);
      scheduleIdleFiller();
    },
    [scheduleIdleFiller, setProgressSteps],
  );

  const resolveToolStepLabel = useCallback(
    (step: { label: string; labelKey?: string }) => {
      if (step.labelKey && tAll.has(step.labelKey)) {
        return tAll(step.labelKey);
      }

      return step.label;
    },
    [tAll],
  );

  const applySettingsProposalSafely = useCallback(
    (next: DocumentSettingsProposal) => {
      const immediate: Partial<BuilderDocumentSettings> = {
        ...next.settings,
      };

      if (Object.keys(immediate).length) {
        useBuilderAIStore.getState().applyDocumentSettings(immediate);
      }

      return { applied: immediate };
    },
    [],
  );

  const run = useCallback(
    async (
      message: string,
      actionId?: string,
      _attachmentOverride?: unknown,
      options?: { replyToQuestion?: string },
    ) => {
      const trimmed = message.trim();

      if (!trimmed) return;

      openPanel();
      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      setLoading(true);
      setApplyError(null);
      beginProgress();

      const priorHistory = toConversationHistory(
        useBuilderAIStore.getState().messages,
      );

      const conversationId = ensureConversationId();
      const replyToQuestion = options?.replyToQuestion?.trim() || null;
      const userMessage: BuilderAIChatMessage = {
        id: createId(),
        role: "user",
        content: trimmed,
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

      setMessages((current) => [...current, userMessage, liveAssistant]);
      setDraft("");

      try {
        const document = TEXT_MESSAGE_AI_SENTINEL_DOCUMENT as any;
        const documentRevision = computeDocumentRevision(document);

        const response = await runBuilderAIChat({
          builder: "text-message",
          document,
          documentRevision,
          documentId: props.documentId,
          conversationId,
          actionId,
          message: trimmed,
          messages: priorHistory,
          args: props.args,
          documentSettings:
            useBuilderAIStore.getState().config?.documentSettings,
          signal: abortController.signal,
          selection: {
            builder: "text-message",
            documentId: props.documentId,
            documentRevision,
            selectionType: "document",
            selectedBlockIds: [],
            selectedBlockTypes: [],
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
              current.map((entry) =>
                entry.id === liveAssistantId
                  ? {
                      ...entry,
                      segments: [...liveSegmentsRef.current],
                      steps: flattenSegmentSteps(liveSegmentsRef.current),
                    }
                  : entry,
              ),
            );
          },
        });

        if (abortController.signal.aborted) return;

        const waitingForUser = response.status === "waiting_for_user";

        if (!waitingForUser && response.settingsProposal) {
          applySettingsProposalSafely(response.settingsProposal);
        }

        const summary = response.text?.trim() || "";
        const segments = finalizeSegmentsWithSummary(
          liveSegmentsRef.current,
          summary,
        );

        setMessages((current) =>
          current.map((entry) =>
            entry.id === liveAssistantId
              ? {
                  ...entry,
                  content: summary,
                  steps: flattenSegmentSteps(segments),
                  segments,
                  settingsProposal: waitingForUser
                    ? null
                    : (response.settingsProposal ?? null),
                  askUser: response.askUser,
                  status: response.status,
                }
              : entry,
          ),
        );
      } catch (error) {
        if (isAbortError(error) || abortController.signal.aborted) return;

        setApplyError({
          message: t("ai.requestFailed"),
          details: error instanceof Error ? error.message : String(error),
        });

        setMessages((current) =>
          current.map((entry) =>
            entry.id === liveAssistantId
              ? {
                  ...entry,
                  content: entry.content.trim() || t("ai.requestFailed"),
                }
              : entry,
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
      applySettingsProposalSafely,
      beginProgress,
      clearProgress,
      noteProgressActivity,
      openPanel,
      props.args,
      props.documentId,
      resolveToolStepLabel,
      setApplyError,
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
    async (label: string, actionId: string) => {
      openPanel();
      await run(label, actionId);
    },
    [openPanel, run],
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

      let userIndex = assistantIndex - 1;

      while (userIndex >= 0 && current[userIndex]?.role !== "user") {
        userIndex -= 1;
      }

      const userMessage = userIndex >= 0 ? current[userIndex] : null;

      if (!userMessage) return;

      setMessages(current.slice(0, userIndex));
      await run(userMessage.content);
    },
    [run, setMessages],
  );

  const openCustomInPanel = useCallback(() => {
    openPanel();
  }, [openPanel]);

  useEffect(() => {
    registerBuilderAIActions({
      run: (message, actionId, attachmentOverride, options) =>
        run(message, actionId, attachmentOverride, options),
      stop,
      retryFromMessage,
      runQuickAction: (label, actionId) => runQuickAction(label, actionId),
      openCustomInPanel,
      applyProposal: () => undefined,
      attachSelectedBlock: () => undefined,
      clearAttachedBlock: () => undefined,
    });

    return () => registerBuilderAIActions(null);
  }, [openCustomInPanel, retryFromMessage, run, runQuickAction, stop]);

  return null;
}

function useTextMessageAIActions() {
  const t = useI18n();
  const [actions, setActions] = useState<ResolvedAction[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await fetchBuilderAICapabilities({
          builder: "text-message",
        });

        if (cancelled) return;

        setActions(
          (result.documentActions ?? []).map((action) =>
            mapDocumentAction(t, action),
          ),
        );
      } catch {
        if (!cancelled) setActions([]);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [t]);

  return actions;
}

const TOOLBAR_GAP_PX = 4;
const ASK_AI_BUTTON_CLASS = "h-7 shrink-0 gap-1.5 text-xs";
const ACTION_BUTTON_CLASS = "h-7 shrink-0 px-2 text-xs";

function TextMessageAskAIToolbar(props: {
  actions: ResolvedAction[];
  loading: boolean;
  onOpenChat: () => void;
  onQuickAction: (action: ResolvedAction) => void;
}) {
  const t = useI18n("builder");
  const containerRef = useRef<HTMLDivElement>(null);
  const askRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(props.actions.length);

  const fitActions = useCallback((available: number, askWidth: number) => {
    const measure = measureRef.current;

    if (!measure) return 0;

    const actionNodes = Array.from(
      measure.querySelectorAll<HTMLElement>("[data-measure-action]"),
    );

    let used = askWidth;
    let count = 0;

    for (const node of actionNodes) {
      const next = used + TOOLBAR_GAP_PX + node.offsetWidth;

      if (next > available) break;

      used = next;
      count += 1;
    }

    return count;
  }, []);

  const recompute = useCallback(() => {
    const container = containerRef.current;
    const measure = measureRef.current;

    if (!container || !measure) return;

    const available = container.clientWidth;
    const plainAsk =
      measure.querySelector<HTMLElement>("[data-measure-ask]")?.offsetWidth ??
      0;

    const splitAsk =
      measure.querySelector<HTMLElement>("[data-measure-ask-split]")
        ?.offsetWidth ?? plainAsk;

    const allFit = fitActions(available, plainAsk);

    if (allFit >= props.actions.length) {
      setVisibleCount(props.actions.length);
      return;
    }

    setVisibleCount(fitActions(available, splitAsk));
  }, [fitActions, props.actions.length]);

  useLayoutEffect(() => {
    recompute();
  }, [props.actions, recompute]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => recompute());
    observer.observe(container);

    return () => observer.disconnect();
  }, [recompute]);

  const visibleActions = props.actions.slice(0, visibleCount);
  const overflowActions = props.actions.slice(visibleCount);
  const useSplit = overflowActions.length > 0;

  const askLabel = (
    <>
      <Sparkles className="size-3.5" />
      {t("ai.textMessage.openChat")}
    </>
  );

  const overflowMenu = overflowActions.map((action) => (
    <DropdownMenuItem
      key={action.id}
      disabled={props.loading}
      onSelect={() => props.onQuickAction(action)}
    >
      {action.label}
    </DropdownMenuItem>
  ));

  return (
    <div
      ref={containerRef}
      className="relative flex min-w-0 w-full items-center"
    >
      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none invisible absolute inset-x-0 top-0 flex h-0 overflow-hidden whitespace-nowrap"
      >
        <Button
          type="button"
          size="sm"
          variant="secondary"
          data-measure-ask=""
          className={ASK_AI_BUTTON_CLASS}
          tabIndex={-1}
        >
          {askLabel}
        </Button>
        <div data-measure-ask-split="" className="inline-flex items-stretch">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className={ASK_AI_BUTTON_CLASS}
            tabIndex={-1}
          >
            {askLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-7 rounded-l-none border-l-0 px-2"
            tabIndex={-1}
          >
            ▾
          </Button>
        </div>
        {props.actions.map((action) => (
          <Button
            key={action.id}
            type="button"
            size="sm"
            variant="ghost"
            data-measure-action={action.id}
            className={ACTION_BUTTON_CLASS}
            tabIndex={-1}
          >
            {action.label}
          </Button>
        ))}
      </div>

      <div className="flex min-w-0 items-center gap-1 overflow-hidden">
        <div ref={askRef} className="shrink-0">
          {useSplit ? (
            <SplitButton
              type="button"
              size="sm"
              variant="secondary"
              className={ASK_AI_BUTTON_CLASS}
              disabled={props.loading}
              onClick={props.onOpenChat}
              dropdownChildren={overflowMenu}
            >
              {askLabel}
            </SplitButton>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className={ASK_AI_BUTTON_CLASS}
              disabled={props.loading}
              onClick={props.onOpenChat}
            >
              {askLabel}
            </Button>
          )}
        </div>

        {visibleActions.map((action) => (
          <Button
            key={action.id}
            type="button"
            size="sm"
            variant="ghost"
            className={ACTION_BUTTON_CLASS}
            disabled={props.loading}
            onClick={() => props.onQuickAction(action)}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

/** Docked AI panel (desktop) / bottom sheet (mobile) + Ask AI toolbar. */
export function TextMessageAIChrome(props: {
  documentId?: string;
  args?: Record<string, unknown>;
  documentSettings?: BuilderDocumentSettings;
  children: (toolbar: ReactNode) => ReactNode;
}) {
  const t = useI18n("builder");
  const ai = useBuilderAI();
  const actions = useTextMessageAIActions();
  const dockBeside = useAiDockBeside();
  const [open, setOpen] = useState(false);
  const registerOpenPanel = useBuilderAIStore((s) => s.registerOpenPanel);

  useEffect(() => {
    return registerOpenPanel(() => setOpen(true));
  }, [registerOpenPanel]);

  const openPanel = useCallback(() => setOpen(true), []);

  const toolbar = (
    <TextMessageAskAIToolbar
      actions={actions}
      loading={ai.loading}
      onOpenChat={() => setOpen((value) => !value)}
      onQuickAction={(action) => {
        openPanel();
        void ai.runQuickAction(action.message, action.id, {
          attachSelection: false,
        });
      }}
    />
  );

  const panelBody = (
    <div className="flex h-full min-h-0 flex-1 flex-col pr-10 pl-3 pb-3">
      <BuilderAIAssistantPanel />
    </div>
  );

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        dockBeside && open ? "lg:flex-row lg:items-stretch lg:gap-6" : null,
      )}
    >
      <TextMessageAIRuntime
        documentId={props.documentId}
        args={props.args}
        documentSettings={props.documentSettings}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {props.children(toolbar)}
      </div>

      {dockBeside && open ? (
        <div className="flex w-[360px] shrink-0 flex-col md:h-full md:max-h-[800px]">
          <div
            className="mb-2 shrink-0 text-sm leading-none font-medium opacity-0 select-none"
            aria-hidden
          >
            &nbsp;
          </div>
          <aside
            className={cn(
              "border-border bg-background relative flex min-h-0 flex-1 flex-col overflow-hidden",
              "rounded-md border",
            )}
          >
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute top-2.5 right-2 z-10 size-7"
              aria-label={t("ai.dismiss")}
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </Button>
            {panelBody}
          </aside>
        </div>
      ) : null}

      {!dockBeside ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className="flex h-[min(85vh,640px)] flex-col gap-0 overflow-hidden p-0"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>{t("ai.title")}</SheetTitle>
            </SheetHeader>
            {panelBody}
          </SheetContent>
        </Sheet>
      ) : null}
    </div>
  );
}
