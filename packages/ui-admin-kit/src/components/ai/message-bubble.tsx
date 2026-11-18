"use client";

import { useI18n } from "@hacado/i18n/client";
import { cn } from "@hacado/ui/cn";
import { Check, Copy } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { AiAskUserCard } from "./ask-user-card";
import { AiThinkingSteps } from "./thinking-steps";
import type { AiChatMessage } from "./types";

function CopyMessageButton(props: { text: string }) {
  const t = useI18n("admin");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;

    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      className="text-primary-foreground hover:text-primary-foreground/80 inline-flex size-5 items-center justify-center rounded-sm transition-colors"
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

export function AiMessageBubble(props: {
  message: AiChatMessage;
  thinkingActive?: boolean;
  liveProgressSteps?: string[];
  elapsedLabel?: string;
  onAnswerAskUser?: (messageId: string, answer: string) => void;
  onSkipAskUser?: (messageId: string) => void;
  askUserDisabled?: boolean;
  /** Content above the bubble (e.g. attached block chip). */
  before?: ReactNode;
  /** Extra sections inside the bubble after main text (proposals, errors). */
  children?: ReactNode;
  /** Action row under the bubble content. */
  actions?: ReactNode;
  showCopy?: boolean;
}) {
  const { message } = props;
  const isUser = message.role === "user";
  const segments = message.segments;
  const hasSegments = Boolean(segments?.length);
  const thinkingSteps = !hasSegments
    ? props.thinkingActive
      ? ((props.liveProgressSteps?.length
          ? props.liveProgressSteps
          : message.steps) ?? [])
      : (message.steps ?? [])
    : [];

  const hasPendingAskUser = Boolean(
    message.askUser && !message.askUserAnswered,
  );

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-1",
        isUser ? "items-end" : "items-start",
      )}
    >
      {props.before}
      {!isUser &&
      !hasSegments &&
      (thinkingSteps.length || props.thinkingActive) ? (
        <AiThinkingSteps
          steps={thinkingSteps}
          active={props.thinkingActive}
          defaultOpen={props.thinkingActive}
          elapsedLabel={props.elapsedLabel}
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
                  <AiThinkingSteps
                    key={`steps-${index}`}
                    steps={segment.steps}
                    active={Boolean(props.thinkingActive && isLast)}
                    defaultOpen={Boolean(props.thinkingActive && isLast)}
                    elapsedLabel={
                      props.thinkingActive && isLast
                        ? props.elapsedLabel
                        : undefined
                    }
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
              <div className="text-primary-foreground/70 text-[11px] leading-snug">
                {message.replyToQuestion}
              </div>
            ) : null}
            {message.content ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : null}
          </div>
        ) : props.thinkingActive ? null : message.content ? (
          <div className="whitespace-pre-wrap">{message.content}</div>
        ) : null}

        {isUser && props.showCopy !== false && message.content ? (
          <div className="mt-1.5 flex justify-end">
            <CopyMessageButton text={message.content} />
          </div>
        ) : null}

        {props.children}

        {hasPendingAskUser && message.askUser && props.onAnswerAskUser ? (
          <AiAskUserCard
            askUser={message.askUser}
            disabled={props.askUserDisabled || props.thinkingActive}
            onAnswer={(answer) => props.onAnswerAskUser?.(message.id, answer)}
            onSkip={
              props.onSkipAskUser
                ? () => props.onSkipAskUser?.(message.id)
                : undefined
            }
          />
        ) : null}

        {props.actions ? (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            {props.actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
