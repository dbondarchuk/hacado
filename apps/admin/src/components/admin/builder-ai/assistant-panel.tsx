"use client";

import { Button } from "@hacado/ui/button";
import { cn } from "@hacado/ui/cn";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@hacado/ui/collapsible";
import { Textarea } from "@hacado/ui/textarea";
import {
  ChevronDown,
  Link2,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BuilderAIApplyErrorCard } from "./apply-error";
import { useBuilderAI } from "./context";
import { formatElapsed } from "./format-elapsed";
import type { BuilderAIChatMessage } from "./types";

function AttachedBlockLink(props: {
  label: string;
  onClick?: () => void;
  onClear?: () => void;
  muted?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 text-[11px]",
        props.muted ? "text-muted-foreground" : "text-muted-foreground",
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
          aria-label="Remove attached block"
          onClick={props.onClear}
        >
          <X className="size-3" />
        </button>
      ) : null}
    </span>
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
            Working
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
          "Thought process"
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

function MessageBubble(props: {
  message: BuilderAIChatMessage;
  onFocusBlock: (blockId: string) => void;
  onApply: (message: BuilderAIChatMessage) => void;
  onDiscard: (messageId: string) => void;
  onRetry: (messageId: string) => void;
  onConfirmSlug: (messageId: string) => void;
  onDismissSlug: (messageId: string) => void;
  showRetry?: boolean;
  retryDisabled?: boolean;
}) {
  const { message } = props;
  const isUser = message.role === "user";
  const appliedSettings = message.settingsProposal?.settings
    ? Object.fromEntries(
        Object.entries(message.settingsProposal.settings).filter(
          ([key]) => key !== "slug",
        ),
      )
    : null;

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
        />
      ) : null}
      {!isUser && message.steps?.length ? (
        <ThinkingSteps steps={message.steps} active={false} />
      ) : null}
      <div
        className={cn(
          "max-w-[95%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-transparent text-foreground",
        )}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
        {message.proposal ? (
          <div className="border-border/50 mt-2 space-y-2 border-t pt-2">
            <div className="text-muted-foreground text-[11px]">
              {message.proposal.summary}
            </div>
            <div className="text-muted-foreground text-[11px]">
              {message.proposal.operations.length} operation
              {message.proposal.operations.length === 1 ? "" : "s"} applied
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-7 text-[11px]"
                onClick={() => props.onApply(message)}
              >
                Re-apply
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-[11px]"
                onClick={() => props.onDiscard(message.id)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        ) : null}
        {message.settingsProposal ? (
          <div className="border-border/50 mt-2 space-y-2 border-t pt-2">
            <div className="text-muted-foreground text-[11px]">
              {message.settingsProposal.summary}
            </div>
            {appliedSettings && Object.keys(appliedSettings).length ? (
              <div className="text-muted-foreground text-[11px]">
                Settings applied · {formatSettingsSummary(appliedSettings)}
              </div>
            ) : null}
          </div>
        ) : null}
        {message.pendingSlug ? (
          <div className="border-border/50 mt-2 space-y-2 border-t pt-2">
            <div className="text-muted-foreground text-[11px]">
              Suggested page URL:{" "}
              <span className="text-foreground font-medium">
                /{message.pendingSlug}
              </span>
            </div>
            <div className="text-muted-foreground text-[11px]">
              Changing the URL can break existing links. Apply it only if you
              want that.
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-7 text-[11px]"
                onClick={() => props.onConfirmSlug(message.id)}
              >
                Apply URL
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-[11px]"
                onClick={() => props.onDismissSlug(message.id)}
              >
                Keep current
              </Button>
            </div>
          </div>
        ) : null}
        {message.applyError ? (
          <div className="mt-2">
            <BuilderAIApplyErrorCard error={message.applyError} />
          </div>
        ) : null}
        {!isUser && props.showRetry ? (
          <div className="mt-2 flex">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-muted-foreground h-7 gap-1 px-2 text-[11px]"
              disabled={props.retryDisabled}
              onClick={() => props.onRetry(message.id)}
            >
              <RotateCcw className="size-3" />
              Retry
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function BuilderAIAssistantPanel() {
  const ai = useBuilderAI();
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

  return (
    <div className="flex max-h-[calc(100dvh-220px)] min-h-[320px] flex-col">
      <div className="flex items-center gap-2 px-1 pb-3 pt-1 text-sm font-medium">
        <Sparkles className="size-4" />
        Builder AI
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 pb-2">
        {ai.messages.length === 0 && !ai.loading ? (
          <div className="text-muted-foreground px-1 text-xs leading-relaxed">
            Ask for rewrites, layout changes, or new sections. Optionally attach
            a selected block to focus the next message.
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
              showRetry={isLatestAssistant}
              retryDisabled={ai.loading}
            />
          );
        })}

        {ai.loading ? (
          <div className="w-full">
            <ThinkingSteps
              steps={ai.progressSteps}
              active
              defaultOpen
              elapsedLabel={formatElapsed(elapsedMs)}
            />
          </div>
        ) : null}

        {ai.applyError && !ai.loading ? (
          <BuilderAIApplyErrorCard error={ai.applyError} />
        ) : null}

        <div ref={bottomRef} />
      </div>

      <div className="border-border space-y-2 border-t px-1 pt-3">
        {ai.attachedBlock ? (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-[11px]">Attached</span>
            <AttachedBlockLink
              label={ai.attachedBlock.label}
              onClick={ai.focusAttachedBlock}
              onClear={ai.clearAttachedBlock}
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
              ? "Attach selected block"
              : "Select a block to attach"}
          </button>
        )}
        <Textarea
          ref={textareaRef}
          value={ai.draft}
          onChange={(event) => ai.setDraft(event.target.value)}
          placeholder="Message Builder AI…"
          rows={3}
          className="min-h-[72px] resize-none text-[13px]"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void ai.run(ai.draft);
            }
          }}
        />
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            disabled={ai.loading || !ai.draft.trim()}
            onClick={() => void ai.run(ai.draft)}
          >
            {ai.loading ? `Working · ${formatElapsed(elapsedMs)}` : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
