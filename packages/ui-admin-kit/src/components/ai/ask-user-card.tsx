"use client";

import { useI18n } from "@hacado/i18n/client";
import type { AskUserRequest } from "@hacado/types/ai";
import { Button } from "@hacado/ui/button";
import { useState } from "react";
import { AiActionLink } from "./action-link";

export function AiAskUserCard(props: {
  askUser: AskUserRequest;
  onAnswer: (answer: string) => void;
  onSkip?: () => void;
  disabled?: boolean;
}) {
  const t = useI18n("admin");
  const { askUser } = props;
  const [custom, setCustom] = useState("");

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
              onClick={() => props.onAnswer(option.label)}
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

                props.onAnswer(custom);
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            className="h-7 text-[11px]"
            disabled={props.disabled || !custom.trim()}
            onClick={() => props.onAnswer(custom)}
          >
            {t("ai.askUserSubmit")}
          </Button>
        </div>
      ) : null}
      {!askUser.required && props.onSkip ? (
        <AiActionLink disabled={props.disabled} onClick={props.onSkip}>
          {t("ai.askUserSkip")}
        </AiActionLink>
      ) : null}
    </div>
  );
}
