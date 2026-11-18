"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  AiActionLink,
  AiChatShell,
  AiComposer,
  AiMessageBubble,
  formatElapsed,
  useElapsedMs,
} from "@hacado/ui-admin-kit/ai";
import { cn } from "@hacado/ui/cn";
import { Link2, RotateCcw, Sparkles, X } from "lucide-react";
import type { ReactNode } from "react";
import { BuilderAIApplyErrorCard } from "./apply-error";
import { useBuilderAI } from "./context";
import type { BuilderAIChatMessage } from "./types";

function AttachedBlockLink(props: {
  label: string;
  onClick?: () => void;
  onClear?: () => void;
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
  const appliedSettings = message.settingsProposal?.settings
    ? Object.fromEntries(
        Object.entries(message.settingsProposal.settings).filter(
          ([key]) => key !== "slug",
        ),
      )
    : null;

  const hasProposalActions = Boolean(message.proposal);
  const hasSlugActions = Boolean(message.pendingSlug);
  const showActionRow =
    !props.thinkingActive &&
    (hasProposalActions || hasSlugActions || Boolean(props.showRetry));

  const actions: ReactNode =
    !isUser && showActionRow ? (
      <>
        {hasProposalActions ? (
          <>
            <AiActionLink onClick={() => props.onApply(message)}>
              {t("ai.reapply")}
            </AiActionLink>
            <AiActionLink onClick={() => props.onDiscard(message.id)}>
              {t("ai.dismiss")}
            </AiActionLink>
          </>
        ) : null}
        {hasSlugActions ? (
          <>
            <AiActionLink onClick={() => props.onConfirmSlug(message.id)}>
              {t("ai.applyUrl")}
            </AiActionLink>
            <AiActionLink onClick={() => props.onDismissSlug(message.id)}>
              {t("ai.keepCurrent")}
            </AiActionLink>
          </>
        ) : null}
        {props.showRetry ? (
          <AiActionLink
            disabled={props.retryDisabled}
            onClick={() => props.onRetry(message.id)}
          >
            <RotateCcw className="size-3" />
            {t("ai.retry")}
          </AiActionLink>
        ) : null}
      </>
    ) : null;

  return (
    <AiMessageBubble
      message={message}
      thinkingActive={props.thinkingActive}
      liveProgressSteps={props.liveProgressSteps}
      elapsedLabel={props.elapsedLabel}
      onAnswerAskUser={props.onAnswerAskUser}
      onSkipAskUser={props.onSkipAskUser}
      askUserDisabled={props.thinkingActive || props.retryDisabled}
      before={
        message.attachedBlock ? (
          <AttachedBlockLink
            label={message.attachedBlock.label}
            onClick={() => props.onFocusBlock(message.attachedBlock!.id)}
            removeLabel={t("ai.removeAttachment")}
          />
        ) : null
      }
      actions={actions}
    >
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
      {message.applyError ? (
        <div className="mt-2">
          <BuilderAIApplyErrorCard error={message.applyError} />
        </div>
      ) : null}
    </AiMessageBubble>
  );
}

export function BuilderAIAssistantPanel() {
  const ai = useBuilderAI();
  const t = useI18n("builder");
  const elapsedMs = useElapsedMs(ai.loading);

  return (
    <AiChatShell
      title={
        <>
          <Sparkles className="size-4" />
          {t("ai.title")}
        </>
      }
      isEmpty={ai.messages.length === 0 && !ai.loading}
      emptyHint={
        ai.builder === "text-message"
          ? t("ai.textMessage.emptyHint")
          : t("ai.emptyHint")
      }
      scrollDeps={[ai.messages, ai.loading, ai.progressSteps]}
      messages={ai.messages.map((message, index) => {
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
      afterMessages={
        ai.applyError && !ai.loading ? (
          <BuilderAIApplyErrorCard error={ai.applyError} />
        ) : null
      }
      composer={
        <AiComposer
          value={ai.draft}
          onChange={ai.setDraft}
          onSubmit={() => {
            void ai.run(ai.draft);
          }}
          onStop={ai.stop}
          loading={ai.loading}
          placeholder={t("ai.placeholder")}
          leading={
            ai.builder === "text-message" ? null : ai.attachedBlock ? (
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
            )
          }
        />
      }
    />
  );
}
