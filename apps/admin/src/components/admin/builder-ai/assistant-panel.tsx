"use client";

import { useI18n } from "@hacado/i18n/client";
import { Button } from "@hacado/ui/button";
import { cn } from "@hacado/ui/cn";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@hacado/ui/collapsible";
import { Textarea } from "@hacado/ui/textarea";
import {
  ArrowUp,
  Check,
  ChevronDown,
  Copy,
  Link2,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  Square,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BuilderAIApplyErrorCard } from "./apply-error";
import { useBuilderAI } from "./context";
import { formatElapsed } from "./format-elapsed";
import type { BuilderAIChatMessage } from "./types";

function AttachedBlockLink(props: {
  label: string;
  onClick?: () => void;
  onClear?: () => void;
  muted?: boolean;
  removeLabel: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 text-[11px]",
        "text-muted-foreground",
      )}
    >
      <Link2 className="size-3 shrink-0 opacity-70" />
      <button
        type="button"
        className="hover:text-foreground truncate underline underline-offset-2"
        onClick={props.onClick}
      >
        {props.label}
      </button>
      {props.onClear ? (
        <button
          type="button"
          className="hover:text-foreground shrink-0"
          aria-label={props.removeLabel}
          onClick={props.onClear}
        >
          <X className="size-3" />
        </button>
      ) : null}
    </span>
  );
}

function ActionLink(props: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={props.disabled}
      onClick={props.onClick}
      className={cn(
        "text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-[11px] underline-offset-2 hover:underline disabled:pointer-events-none disabled:opacity-50",
        props.className,
      )}
    >
      {props.children}
    </button>
  );
}

function useElapsedMs(active: boolean): number {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsedMs(0);
      return;
    }

    const startedAt = Date.now();
    setElapsedMs(0);

    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 250);

    return () => window.clearInterval(timer);
  }, [active]);

  return elapsedMs;
}

function ThinkingSteps(props: {
  steps: string[];
  active?: boolean;
  defaultOpen?: boolean;
  elapsedLabel?: string;
  workingLabel: string;
  thoughtProcessLabel: string;
}) {
  const [open, setOpen] = useState(Boolean(props.defaultOpen ?? props.active));

  useEffect(() => {
    if (props.active) setOpen(true);
    else setOpen(false);
  }, [props.active]);

  if (!props.steps.length && !props.active) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-1.5">
      <CollapsibleTrigger className="text-muted-foreground/80 hover:text-muted-foreground inline-flex items-center gap-1.5 text-[11px]">
        {props.active ? (
          <LoaderCircle className="size-3 animate-spin" />
        ) : (
          <ChevronDown
            className={cn(
              "size-3 transition-transform",
              open ? "rotate-0" : "-rotate-90",
            )}
          />
        )}
        {props.active ? (
          <span>
            {props.workingLabel}
            {props.elapsedLabel ? (
              <span className="text-muted-foreground/70">
                {" "}
                · {props.elapsedLabel}
              </span>
            ) : (
              "…"
            )}
          </span>
        ) : (
          props.thoughtProcessLabel
        )}
      </CollapsibleTrigger>
      {props.steps.length ? (
        <CollapsibleContent className="mt-1.5 space-y-1 border-l border-border/50 pl-2.5">
          {props.steps.map((step, index) => (
            <div
              key={`${step}-${index}`}
              className={cn(
                "text-[11px] leading-snug",
                props.active && index === props.steps.length - 1
                  ? "text-muted-foreground"
                  : "text-muted-foreground/70",
              )}
            >
              {step}
            </div>
          ))}
        </CollapsibleContent>
      ) : null}
    </Collapsible>
  );
}

function formatSettingsSummary(
  settings: Record<string, unknown> | undefined,
): string {
  if (!settings) return "";

  return Object.entries(settings)
    .filter(([, value]) => value != null && value !== "")
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" · ");
}

function CopyMessageButton(props: { text: string }) {
  const t = useI18n("builder");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;

    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      className="text-primary-foreground hover:text-primary-foreground/80 transition-colors inline-flex size-5 items-center justify-center rounded-sm"
      aria-label={copied ? t("ai.copied") : t("ai.copy")}
      onClick={() => {
        void navigator.clipboard.writeText(props.text).then(() => {
          setCopied(true);
        });
      }}
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
    </button>
  );
}

function AskUserCard(props: {
  message: BuilderAIChatMessage;
  onAnswer: (messageId: string, answer: string) => void;
  onSkip: (messageId: string) => void;
  disabled?: boolean;
}) {
  const t = useI18n("builder");
  const askUser = props.message.askUser;
  const [custom, setCustom] = useState("");

  if (!askUser || props.message.askUserAnswered) return null;

  const showCustom =
    askUser.allowCustomAnswer !== false &&
    (!askUser.options?.length || askUser.allowCustomAnswer === true);

  return (
    <div className="border-border/50 mt-2 space-y-2 border-t pt-2">
      <div className="text-foreground text-[13px] font-medium leading-snug">
        {askUser.question}
      </div>
      {askUser.reason ? (
        <div className="text-muted-foreground text-[11px] leading-relaxed">
          {askUser.reason}
        </div>
      ) : null}
      {askUser.options?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {askUser.options.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-[11px]"
              disabled={props.disabled}
              onClick={() => props.onAnswer(props.message.id, option.label)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      ) : null}
      {showCustom ? (
        <div className="flex items-center gap-1.5">
          <input
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            placeholder={t("ai.askUserCustomPlaceholder")}
            disabled={props.disabled}
            className="border-input bg-background h-7 min-w-0 flex-1 rounded-md border px-2 text-[11px]"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();

                if (!custom.trim() || props.disabled) return;

                props.onAnswer(props.message.id, custom);
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            className="h-7 text-[11px]"
            disabled={props.disabled || !custom.trim()}
            onClick={() => props.onAnswer(props.message.id, custom)}
          >
            {t("ai.askUserSubmit")}
          </Button>
        </div>
      ) : null}
      {!askUser.required ? (
        <ActionLink
          disabled={props.disabled}
          onClick={() => props.onSkip(props.message.id)}
        >
          {t("ai.askUserSkip")}
        </ActionLink>
      ) : null}
    </div>
  );
}

function MessageBubble(props: {
  message: BuilderAIChatMessage;
  onFocusBlock: (blockId: string) => void;
  onApply: (message: BuilderAIChatMessage) => void;
  onDiscard: (messageId: string) => void;
  onRetry: (messageId: string) => void;
  onConfirmSlug: (messageId: string) => void;
  onDismissSlug: (messageId: string) => void;
  onAnswerAskUser: (messageId: string, answer: string) => void;
  onSkipAskUser: (messageId: string) => void;
  showRetry?: boolean;
  retryDisabled?: boolean;
  thinkingActive?: boolean;
  liveProgressSteps?: string[];
  elapsedLabel?: string;
}) {
  const t = useI18n("builder");
  const { message } = props;
  const isUser = message.role === "user";
  const content = message.content.trim();
  const appliedSettings = message.settingsProposal?.settings
    ? Object.fromEntries(
        Object.entries(message.settingsProposal.settings).filter(
          ([key]) => key !== "slug",
        ),
      )
    : null;

  const hasProposalActions = Boolean(message.proposal);
  const hasSlugActions = Boolean(message.pendingSlug);
  const hasPendingAskUser = Boolean(
    message.askUser && !message.askUserAnswered,
  );
  const showActionRow =
    !props.thinkingActive &&
    (hasProposalActions || hasSlugActions || Boolean(props.showRetry));
  const segments = message.segments;
  const hasSegments = Boolean(segments?.length);
  const thinkingSteps = !hasSegments
    ? props.thinkingActive
      ? ((props.liveProgressSteps?.length
          ? props.liveProgressSteps
          : message.steps) ?? [])
      : (message.steps ?? [])
    : [];

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-1",
        isUser ? "items-end" : "items-start",
      )}
    >
      {message.attachedBlock ? (
        <AttachedBlockLink
          label={message.attachedBlock.label}
          onClick={() => props.onFocusBlock(message.attachedBlock!.id)}
          removeLabel={t("ai.removeAttachment")}
        />
      ) : null}
      {!isUser && !hasSegments && (thinkingSteps.length || props.thinkingActive) ? (
        <ThinkingSteps
          steps={thinkingSteps}
          active={props.thinkingActive}
          defaultOpen={props.thinkingActive}
          elapsedLabel={props.elapsedLabel}
          workingLabel={t("ai.working")}
          thoughtProcessLabel={t("ai.thoughtProcess")}
        />
      ) : null}
      <div
        className={cn(
          "max-w-[95%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-transparent text-foreground",
        )}
      >
        {!isUser && hasSegments ? (
          <div className="flex flex-col gap-2">
            {segments!.map((segment, index) => {
              if (segment.type === "steps") {
                const isLast = index === segments!.length - 1;

                return (
                  <ThinkingSteps
                    key={`steps-${index}`}
                    steps={segment.steps}
                    active={Boolean(props.thinkingActive && isLast)}
                    defaultOpen={Boolean(props.thinkingActive && isLast)}
                    elapsedLabel={
                      props.thinkingActive && isLast
                        ? props.elapsedLabel
                        : undefined
                    }
                    workingLabel={t("ai.working")}
                    thoughtProcessLabel={t("ai.thoughtProcess")}
                  />
                );
              }

              if (!segment.text.trim()) return null;

              const textSegments = segments!.filter(
                (entry) => entry.type === "text" && entry.text.trim(),
              );
              const isLatestText =
                textSegments[textSegments.length - 1] === segment;

              return (
                <div
                  key={`text-${index}`}
                  className={cn(
                    "whitespace-pre-wrap",
                    isLatestText
                      ? "text-foreground"
                      : "text-muted-foreground/80",
                  )}
                >
                  {segment.text}
                </div>
              );
            })}
          </div>
        ) : message.content || message.replyToQuestion ? (
          <div className="space-y-1">
            {isUser && message.replyToQuestion ? (
              <div
                className={cn(
                  "text-[11px] leading-snug",
                  "text-primary-foreground/70",
                )}
              >
                {message.replyToQuestion}
              </div>
            ) : null}
            {message.content ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : null}
          </div>
        ) : props.thinkingActive ? null : (
          <div className="whitespace-pre-wrap">{message.content}</div>
        )}
        {isUser ? (
          <div className="mt-1.5 flex justify-end">
            <CopyMessageButton text={message.content} />
          </div>
        ) : null}
        {message.proposal ? (
          <div className="border-border/50 mt-2 space-y-1.5 border-t pt-2">
            <div className="text-muted-foreground text-[11px]">
              {t("ai.operationsApplied", {
                count: message.proposal.operations.length,
              })}
            </div>
          </div>
        ) : null}
        {message.settingsProposal ? (
          <div className="border-border/50 mt-2 space-y-1.5 border-t pt-2">
            {appliedSettings && Object.keys(appliedSettings).length ? (
              <div className="text-muted-foreground text-[11px]">
                {t("ai.settingsApplied")} ·{" "}
                {formatSettingsSummary(appliedSettings)}
              </div>
            ) : null}
          </div>
        ) : null}
        {message.pendingSlug ? (
          <div className="border-border/50 mt-2 space-y-1.5 border-t pt-2">
            <div className="text-muted-foreground text-[11px]">
              {t("ai.suggestedSlug")}{" "}
              <span className="text-foreground font-medium">
                /{message.pendingSlug}
              </span>
            </div>
            <div className="text-muted-foreground text-[11px]">
              {t("ai.slugWarning")}
            </div>
          </div>
        ) : null}
        {hasPendingAskUser ? (
          <AskUserCard
            message={message}
            disabled={props.thinkingActive || props.retryDisabled}
            onAnswer={props.onAnswerAskUser}
            onSkip={props.onSkipAskUser}
          />
        ) : null}
        {message.applyError ? (
          <div className="mt-2">
            <BuilderAIApplyErrorCard error={message.applyError} />
          </div>
        ) : null}
        {!isUser && showActionRow ? (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            {hasProposalActions ? (
              <>
                <ActionLink onClick={() => props.onApply(message)}>
                  {t("ai.reapply")}
                </ActionLink>
                <ActionLink onClick={() => props.onDiscard(message.id)}>
                  {t("ai.dismiss")}
                </ActionLink>
              </>
            ) : null}
            {hasSlugActions ? (
              <>
                <ActionLink onClick={() => props.onConfirmSlug(message.id)}>
                  {t("ai.applyUrl")}
                </ActionLink>
                <ActionLink onClick={() => props.onDismissSlug(message.id)}>
                  {t("ai.keepCurrent")}
                </ActionLink>
              </>
            ) : null}
            {props.showRetry ? (
              <ActionLink
                disabled={props.retryDisabled}
                onClick={() => props.onRetry(message.id)}
              >
                <RotateCcw className="size-3" />
                {t("ai.retry")}
              </ActionLink>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function BuilderAIAssistantPanel() {
  const ai = useBuilderAI();
  const t = useI18n("builder");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const elapsedMs = useElapsedMs(ai.loading);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [ai.messages, ai.loading, ai.progressSteps]);

  useEffect(() => {
    if (!ai.loading) {
      textareaRef.current?.focus();
    }
  }, [ai.loading, ai.attachedBlock?.id]);

  const canSend = Boolean(ai.draft.trim()) && !ai.loading;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden pt-2">
      <div className="flex shrink-0 items-center gap-2 px-1 pb-3 pt-1 text-sm font-medium">
        <Sparkles className="size-4" />
        {t("ai.title")}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 pb-2">
        {ai.messages.length === 0 && !ai.loading ? (
          <div className="text-muted-foreground px-1 text-xs leading-relaxed">
            {t("ai.emptyHint")}
          </div>
        ) : null}

        {ai.messages.map((message, index) => {
          const isLatestAssistant =
            message.role === "assistant" &&
            !ai.messages
              .slice(index + 1)
              .some((entry) => entry.role === "assistant");

          return (
            <MessageBubble
              key={message.id}
              message={message}
              onFocusBlock={ai.focusBlock}
              onApply={(item) => {
                if (item.proposal) ai.applyProposal(item.proposal, item.id);
              }}
              onDiscard={ai.discardProposal}
              onRetry={(messageId) => void ai.retryFromMessage(messageId)}
              onConfirmSlug={ai.confirmPendingSlug}
              onDismissSlug={ai.dismissPendingSlug}
              onAnswerAskUser={ai.answerAskUser}
              onSkipAskUser={ai.skipAskUser}
              showRetry={isLatestAssistant && !ai.loading}
              retryDisabled={ai.loading}
              thinkingActive={ai.loading && isLatestAssistant}
              liveProgressSteps={ai.progressSteps}
              elapsedLabel={formatElapsed(elapsedMs)}
            />
          );
        })}

        {ai.applyError && !ai.loading ? (
          <BuilderAIApplyErrorCard error={ai.applyError} />
        ) : null}

        <div ref={bottomRef} />
      </div>

      <div className="border-border shrink-0 border-t px-1 pt-3 pb-1">
        <div
          className={cn(
            "border-input bg-background rounded-md border",
            "focus-within:ring-ring focus-within:ring-offset-background focus-within:ring-2 focus-within:ring-offset-2",
          )}
        >
          <Textarea
            ref={textareaRef}
            value={ai.draft}
            onChange={(event) => ai.setDraft(event.target.value)}
            placeholder={t("ai.placeholder")}
            rows={3}
            className="min-h-[72px] resize-none border-0 bg-transparent text-[13px] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();

                if (ai.loading) return;

                void ai.run(ai.draft);
              }
            }}
          />
          <div className="flex items-end justify-between gap-2 px-2 pb-2">
            <div className="min-w-0 flex-1 pb-0.5">
              {ai.attachedBlock ? (
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-muted-foreground shrink-0 text-[11px]">
                    {t("ai.attached")}
                  </span>
                  <AttachedBlockLink
                    label={ai.attachedBlock.label}
                    onClick={ai.focusAttachedBlock}
                    onClear={ai.clearAttachedBlock}
                    removeLabel={t("ai.removeAttachment")}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground disabled:text-muted-foreground/50 text-[11px] underline-offset-2 hover:underline disabled:no-underline"
                  onClick={ai.attachSelectedBlock}
                  disabled={!ai.selectedBlockId}
                >
                  {ai.selectedBlockId
                    ? t("ai.attachSelected")
                    : t("ai.selectToAttach")}
                </button>
              )}
            </div>
            <Button
              type="button"
              size="icon"
              variant={ai.loading ? "secondary" : "default"}
              className="size-8 shrink-0"
              disabled={ai.loading ? false : !canSend}
              onClick={() => {
                if (ai.loading) {
                  ai.stop();
                  return;
                }

                void ai.run(ai.draft);
              }}
            >
              {ai.loading ? (
                <Square className="size-3.5 fill-current" />
              ) : (
                <ArrowUp className="size-4" />
              )}
              <span className="sr-only">
                {ai.loading ? t("ai.stop") : t("ai.send")}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
