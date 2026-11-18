"use client";

import { stockMediaApi } from "@hacado/api-sdk/admin/stock-media";
import { useI18n } from "@hacado/i18n/client";
import {
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
import { DropdownMenuItem } from "@hacado/ui/dropdown-menu";
import { SplitButton } from "@hacado/ui/split-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@hacado/ui/tabs";
import { Sparkles } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { UseFormReturn } from "react-hook-form";
import { generateBlogPostAi } from "../actions";
import type { BlogPostUpdateModel } from "../models";
import {
  BlogAdminKeys,
  BlogAdminNamespace,
  blogAdminNamespace,
} from "../translations/types";
import { BLOG_AI_ACTIONS, type BlogAiActionId } from "./actions";
import { plateValueToPlainText } from "./corpus";
import {
  BLOG_AI_SSE_ASK_USER,
  BLOG_AI_SSE_DELTA,
  BLOG_AI_SSE_PROGRESS,
  type BlogAiAskUserPayload,
  type BlogAiDeltaPayload,
  type BlogAiProgressPayload,
} from "./events";
import type { BlogAiProposal } from "./schema";

const TOOLBAR_GAP_PX = 4;
const ASK_AI_BUTTON_CLASS = "h-7 shrink-0 gap-1.5 text-xs";
const ACTION_BUTTON_CLASS = "h-7 shrink-0 px-2 text-xs";

type SideTab = "settings" | "ai";

type AppliedProposal = BlogAiProposal & {
  featuredImage?: string;
};

type BlogAiChatMessage = AiChatMessage & {
  proposal?: AppliedProposal | null;
  applied?: boolean;
  error?: string | null;
};

type ResolvedAction = {
  id: BlogAiActionId;
  label: string;
};

export type BlogPostAiChromeApi = {
  toolbar: ReactNode;
  sidebar: (settings: ReactNode) => ReactNode;
};

function newMessageId(): string {
  return `blog-ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

/** Keep tool/progress steps; drop streamed text (may be raw JSON). */
function keepStepSegments(
  segments: AiChatStreamSegment[] | undefined,
): AiChatStreamSegment[] | undefined {
  const steps = (segments ?? []).filter(
    (segment): segment is Extract<AiChatStreamSegment, { type: "steps" }> =>
      segment.type === "steps",
  );

  return steps.length ? steps : undefined;
}

function looksLikeJsonPayload(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.startsWith("{") || trimmed.startsWith("```");
}

function BlogAskAIToolbar(props: {
  actions: ResolvedAction[];
  loading: boolean;
  disabled?: boolean;
  openLabel: string;
  onOpenChat: () => void;
  onQuickAction: (action: ResolvedAction) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
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
  const busy = props.loading || Boolean(props.disabled);

  const askLabel = (
    <>
      <Sparkles className="size-3.5" />
      {props.openLabel}
    </>
  );

  const overflowMenu = overflowActions.map((action) => (
    <DropdownMenuItem
      key={action.id}
      disabled={busy}
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
        <div className="shrink-0">
          {useSplit ? (
            <SplitButton
              type="button"
              size="sm"
              variant="secondary"
              className={ASK_AI_BUTTON_CLASS}
              disabled={busy}
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
              disabled={busy}
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
            disabled={busy}
            onClick={() => props.onQuickAction(action)}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function ProposalDetails(props: {
  proposal: AppliedProposal;
  applied?: boolean;
  t: (key: BlogAdminKeys) => string;
}) {
  const { proposal, t } = props;
  const bodyPreview = proposal.contentMarkdown?.replace(/\s+/g, " ").trim();

  return (
    <div className="border-border/50 mt-2 space-y-1.5 border-t pt-2">
      <div className="text-muted-foreground text-[11px] font-medium">
        {props.applied ? t("ai.applied") : t("ai.proposalTitle")}
      </div>
      <ul className="space-y-1 text-[12px]">
        {proposal.title != null ? (
          <li>
            <span className="font-medium">{t("ai.fields.title")}: </span>
            {proposal.title}
          </li>
        ) : null}
        {proposal.slug != null ? (
          <li>
            <span className="font-medium">{t("ai.fields.slug")}: </span>
            {proposal.slug}
          </li>
        ) : null}
        {proposal.tags ? (
          <li>
            <span className="font-medium">{t("ai.fields.tags")}: </span>
            {proposal.tags.join(", ") || "—"}
          </li>
        ) : null}
        {typeof proposal.isPublished === "boolean" ? (
          <li>
            <span className="font-medium">{t("ai.fields.status")}: </span>
            {proposal.isPublished
              ? t("form.isPublished.published")
              : t("form.isPublished.draft")}
          </li>
        ) : null}
        {proposal.publicationDate ? (
          <li>
            <span className="font-medium">
              {t("ai.fields.publicationDate")}:{" "}
            </span>
            {String(proposal.publicationDate)}
          </li>
        ) : null}
        {proposal.featuredImage ? (
          <li className="flex flex-col gap-2">
            <span className="font-medium">{t("ai.fields.featuredImage")}</span>
            <img
              src={proposal.featuredImage}
              alt=""
              className="max-h-32 w-auto rounded-md object-cover"
            />
          </li>
        ) : null}
        {bodyPreview ? (
          <li>
            <span className="font-medium">{t("ai.fields.body")}: </span>
            <span className="text-muted-foreground">
              {bodyPreview.slice(0, 180)}
              {bodyPreview.length > 180 ? "…" : ""}
            </span>
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function BlogAiPanel(props: {
  messages: BlogAiChatMessage[];
  draft: string;
  setDraft: (value: string) => void;
  loading: boolean;
  disabled?: boolean;
  onSubmit: () => void;
  onStop: () => void;
  onAnswerAskUser: (messageId: string, answer: string) => void;
  t: (key: BlogAdminKeys) => string;
}) {
  const elapsedMs = useElapsedMs(props.loading);

  return (
    <AiChatShell
      className="h-full min-h-0 px-1"
      title={
        <>
          <Sparkles className="size-4" />
          {props.t("ai.title")}
        </>
      }
      isEmpty={props.messages.length === 0 && !props.loading}
      emptyHint={props.t("ai.panelHint")}
      scrollDeps={[props.messages, props.loading]}
      messages={props.messages.map((message, index) => {
        const isLatestAssistant =
          message.role === "assistant" &&
          !props.messages
            .slice(index + 1)
            .some((entry) => entry.role === "assistant");

        return (
          <AiMessageBubble
            key={message.id}
            message={message}
            thinkingActive={props.loading && isLatestAssistant}
            elapsedLabel={formatElapsed(elapsedMs)}
            onAnswerAskUser={props.onAnswerAskUser}
            askUserDisabled={props.loading || props.disabled}
          >
            {message.error ? (
              <p className="mt-2 text-[12px] text-destructive" role="alert">
                {message.error}
              </p>
            ) : null}
            {message.proposal ? (
              <ProposalDetails
                proposal={message.proposal}
                applied={message.applied}
                t={props.t}
              />
            ) : null}
          </AiMessageBubble>
        );
      })}
      composer={
        <AiComposer
          value={props.draft}
          onChange={props.setDraft}
          onSubmit={props.onSubmit}
          onStop={props.onStop}
          loading={props.loading}
          disabled={props.disabled}
          placeholder={props.t("ai.placeholder")}
          className="px-0"
        />
      }
    />
  );
}

/** Ask AI toolbar + settings/AI tabbed sidebar (same column). */
export function BlogPostAiChrome({
  appId,
  postId,
  form,
  slugManuallyChanged,
  onSlugManualChange,
  generateSlug,
  setContentMarkdown,
  disabled,
  children,
}: {
  appId: string;
  postId?: string;
  form: UseFormReturn<BlogPostUpdateModel>;
  slugManuallyChanged: boolean;
  onSlugManualChange: () => void;
  generateSlug: (title: string) => string;
  /** Apply body markdown through the live Plate editor (tables, headings, …). */
  setContentMarkdown: (markdown: string) => void;
  disabled?: boolean;
  children: (api: BlogPostAiChromeApi) => ReactNode;
}) {
  const t = useI18n<BlogAdminNamespace, BlogAdminKeys>(blogAdminNamespace);
  const tAll = useI18n();
  const [sideTab, setSideTab] = useState<SideTab>("settings");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<BlogAiChatMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const liveAssistantIdRef = useRef<string | null>(null);

  const quickActions = useMemo<ResolvedAction[]>(
    () =>
      BLOG_AI_ACTIONS.filter(
        (action) => action.id !== "custom_instruction",
      ).map((action) => ({
        id: action.id,
        label: t(action.labelKey),
      })),
    [t],
  );

  const openAiTab = useCallback(() => setSideTab("ai"), []);

  const patchAssistant = useCallback(
    (messageId: string, patch: Partial<BlogAiChatMessage>) => {
      setMessages((current) =>
        current.map((message) =>
          message.id === messageId ? { ...message, ...patch } : message,
        ),
      );
    },
    [],
  );

  const applyProposal = useCallback(
    async (messageId: string, proposal: AppliedProposal) => {
      try {
        if (proposal.title != null) {
          form.setValue("title", proposal.title, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }

        const nextSlug =
          proposal.slug?.trim() ||
          (proposal.title && !slugManuallyChanged
            ? generateSlug(proposal.title)
            : undefined);

        if (nextSlug) {
          if (proposal.slug?.trim()) {
            onSlugManualChange();
          }

          form.setValue("slug", nextSlug, {
            shouldDirty: true,
            shouldValidate: true,
          });

          await form.trigger("slug");
        }

        if (proposal.tags) {
          form.setValue("tags", proposal.tags, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }

        if (proposal.contentMarkdown != null) {
          setContentMarkdown(proposal.contentMarkdown);
        }

        if (proposal.publicationDate) {
          const date = new Date(proposal.publicationDate);
          if (!Number.isNaN(date.getTime())) {
            form.setValue("publicationDate", date, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }
        }

        if (typeof proposal.isPublished === "boolean") {
          form.setValue("isPublished", proposal.isPublished, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }

        if (proposal.featuredImage) {
          form.setValue("featuredImage", proposal.featuredImage, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }

        patchAssistant(messageId, {
          proposal,
          applied: true,
        });
      } catch (err: any) {
        patchAssistant(messageId, {
          proposal,
          applied: false,
          error: err?.message || t("ai.errorGeneric"),
        });
      }
    },
    [
      form,
      generateSlug,
      onSlugManualChange,
      patchAssistant,
      setContentMarkdown,
      slugManuallyChanged,
      t,
    ],
  );

  const runAction = useCallback(
    async (
      actionId: BlogAiActionId,
      customInstruction?: string,
      options?: { replyToQuestion?: string | null },
    ) => {
      const values = form.getValues();
      const text =
        customInstruction?.trim() ||
        (actionId === "custom_instruction" ? draft.trim() : "");

      if (actionId === "custom_instruction" && !text) {
        openAiTab();
        const errorId = newMessageId();
        setMessages((current) => [
          ...current,
          {
            id: errorId,
            role: "assistant",
            content: "",
            error: t("ai.emptyInstruction"),
            createdAt: Date.now(),
          },
        ]);

        return;
      }

      openAiTab();
      abortRef.current?.abort();
      const abortController = new AbortController();
      abortRef.current = abortController;

      const userContent =
        text ||
        quickActions.find((action) => action.id === actionId)?.label ||
        actionId;

      const userMessage: BlogAiChatMessage = {
        id: newMessageId(),
        role: "user",
        content: userContent,
        replyToQuestion: options?.replyToQuestion ?? null,
        createdAt: Date.now(),
      };

      const assistantId = newMessageId();
      liveAssistantIdRef.current = assistantId;

      const assistantMessage: BlogAiChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        segments: [],
        createdAt: Date.now(),
      };

      setMessages((current) => [...current, userMessage, assistantMessage]);
      setLoading(true);
      setDraft("");

      try {
        const result = await generateBlogPostAi(
          appId,
          {
            actionId,
            instruction: text || undefined,
            postId,
            title: values.title,
            slug: values.slug,
            tags: values.tags,
            contentText: plateValueToPlainText(values.content),
            publicationDate: values.publicationDate
              ? new Date(values.publicationDate).toISOString()
              : undefined,
            isPublished: values.isPublished,
            featuredImage: values.featuredImage,
          },
          {
            signal: abortController.signal,
            onEvent: (event, data) => {
              if (event === BLOG_AI_SSE_PROGRESS) {
                const payload = data as BlogAiProgressPayload | undefined;
                if (!payload) return;

                const label =
                  payload.labelKey && tAll.has(payload.labelKey)
                    ? String(tAll(payload.labelKey))
                    : payload.label;

                if (!label) return;

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

                return;
              }

              if (event === BLOG_AI_SSE_ASK_USER) {
                const payload = data as BlogAiAskUserPayload | undefined;
                if (!payload) return;

                patchAssistant(assistantId, {
                  askUser: payload,
                  askUserAnswered: false,
                });

                return;
              }

              if (event === BLOG_AI_SSE_DELTA) {
                const payload = data as BlogAiDeltaPayload | undefined;
                if (!payload?.text) return;

                // Ignore raw proposal JSON dumps; only accept human summary text.
                if (looksLikeJsonPayload(payload.text)) return;

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
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId
                ? {
                    ...message,
                    askUser: result.askUser,
                    askUserAnswered: false,
                    content: result.text?.trim() || "",
                    segments: keepStepSegments(message.segments),
                  }
                : message,
            ),
          );

          return;
        }

        const proposalResult = result.proposal;
        let featuredImage: string | undefined;

        if (proposalResult.featuredImageQuery?.trim()) {
          try {
            const search = await stockMediaApi.search({
              provider: "unsplash",
              type: "photo",
              query: proposalResult.featuredImageQuery.trim(),
              page: 1,
              limit: 1,
            });

            const photo = search.items[0];
            if (photo) {
              featuredImage = photo.urls.regular;
              void stockMediaApi
                .trackDownload({
                  provider: "unsplash",
                  downloadLocation: photo.downloadLocation,
                })
                .catch(() => undefined);
            }
          } catch {
            // Stock search is optional; keep text proposal.
          }
        }

        const summary =
          proposalResult.summary?.trim() || t("ai.summaryFallback");

        const appliedProposal: AppliedProposal = {
          ...proposalResult,
          featuredImage,
        };

        setMessages((current) =>
          current.map((message) => {
            if (message.id !== assistantId) return message;

            const stepSegments = keepStepSegments(message.segments) ?? [];
            const narrationSegments = (message.segments ?? []).filter(
              (
                segment,
              ): segment is Extract<AiChatStreamSegment, { type: "text" }> =>
                segment.type === "text" &&
                Boolean(segment.text.trim()) &&
                !looksLikeJsonPayload(segment.text),
            );

            const hasSummaryAlready = narrationSegments.some((segment) =>
              segment.text.includes(summary),
            );

            const textSegments = hasSummaryAlready
              ? narrationSegments
              : [
                  ...narrationSegments,
                  { type: "text" as const, text: summary },
                ];

            return {
              ...message,
              proposal: appliedProposal,
              content: textSegments
                .map((segment) => segment.text.trim())
                .join("\n\n"),
              segments: [...stepSegments, ...textSegments],
            };
          }),
        );

        await applyProposal(assistantId, appliedProposal);
      } catch (err: any) {
        if (
          (err instanceof DOMException && err.name === "AbortError") ||
          (err instanceof Error && err.name === "AbortError")
        ) {
          return;
        }

        patchAssistant(assistantId, {
          error: err?.message || t("ai.errorGeneric"),
        });
      } finally {
        if (abortRef.current === abortController) {
          abortRef.current = null;
        }

        if (liveAssistantIdRef.current === assistantId) {
          liveAssistantIdRef.current = null;
        }

        setLoading(false);
      }
    },
    [
      appId,
      applyProposal,
      draft,
      form,
      openAiTab,
      patchAssistant,
      postId,
      quickActions,
      t,
      tAll,
    ],
  );

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const answerAskUser = useCallback(
    (messageId: string, answer: string) => {
      const message = messages.find((entry) => entry.id === messageId);
      const question = message?.askUser?.question;

      patchAssistant(messageId, { askUserAnswered: true });

      void runAction(
        "custom_instruction",
        `User answer to previous question: ${answer}`,
        { replyToQuestion: question },
      );
    },
    [messages, patchAssistant, runAction],
  );

  const toolbar = (
    <BlogAskAIToolbar
      actions={quickActions}
      loading={loading}
      disabled={disabled}
      openLabel={t("ai.open")}
      onOpenChat={() =>
        setSideTab((current) => (current === "ai" ? "settings" : "ai"))
      }
      onQuickAction={(action) => {
        void runAction(action.id);
      }}
    />
  );

  const sidebar = (settings: ReactNode) => (
    <Tabs
      value={sideTab}
      onValueChange={(value) => setSideTab(value as SideTab)}
      className="flex h-full min-h-0 flex-col gap-3 overflow-hidden"
    >
      <TabsList variant="line" className="w-full shrink-0">
        <TabsTrigger value="settings" className="flex-1">
          {t("ai.tabs.settings")}
        </TabsTrigger>
        <TabsTrigger value="ai" className="flex-1 gap-1.5">
          <Sparkles className="size-3.5" />
          {t("ai.tabs.ai")}
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value="settings"
        className={cn(
          "mt-0 min-h-0 outline-none",
          "data-[state=active]:flex data-[state=active]:flex-1 data-[state=active]:flex-col data-[state=active]:gap-4 data-[state=active]:overflow-y-auto px-1",
        )}
      >
        {settings}
      </TabsContent>

      <TabsContent
        value="ai"
        className={cn(
          "mt-0 min-h-0 outline-none",
          "data-[state=active]:flex data-[state=active]:min-h-0 data-[state=active]:flex-1 data-[state=active]:flex-col data-[state=active]:overflow-hidden px-1",
        )}
      >
        <BlogAiPanel
          messages={messages}
          draft={draft}
          setDraft={setDraft}
          loading={loading}
          disabled={disabled}
          onSubmit={() => {
            void runAction("custom_instruction", draft);
          }}
          onStop={() => abortRef.current?.abort()}
          onAnswerAskUser={answerAskUser}
          t={t}
        />
      </TabsContent>
    </Tabs>
  );

  return <>{children({ toolbar, sidebar })}</>;
}
