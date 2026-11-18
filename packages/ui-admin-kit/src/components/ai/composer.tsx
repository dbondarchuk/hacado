"use client";

import { useI18n } from "@hacado/i18n/client";
import { Button } from "@hacado/ui/button";
import { cn } from "@hacado/ui/cn";
import { Textarea } from "@hacado/ui/textarea";
import {
  TextareaGroup,
  TextareaGroupFooter,
  textareaGroupControlClassName,
} from "@hacado/ui/textarea-group";
import { ArrowUp, Square } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

export function AiComposer(props: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** Host-specific placeholder (product name / context). */
  placeholder: string;
  leading?: ReactNode;
  autoFocusWhenIdle?: boolean;
  className?: string;
}) {
  const t = useI18n("admin");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend =
    Boolean(props.value.trim()) && !props.loading && !props.disabled;

  useEffect(() => {
    if (props.autoFocusWhenIdle === false) return;

    if (!props.loading) {
      textareaRef.current?.focus();
    }
  }, [props.loading, props.autoFocusWhenIdle]);

  return (
    <div
      className={cn(
        "border-border shrink-0 border-t px-1 pt-3 pb-1",
        props.className,
      )}
    >
      <TextareaGroup>
        <Textarea
          ref={textareaRef}
          value={props.value}
          onChange={(event) => props.onChange(event.target.value)}
          placeholder={props.placeholder}
          rows={3}
          disabled={props.disabled && !props.loading}
          className={cn(
            textareaGroupControlClassName,
            "min-h-[72px] resize-none text-[13px]",
          )}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();

              if (props.loading) return;
              if (!canSend) return;

              props.onSubmit();
            }
          }}
        />
        <TextareaGroupFooter>
          <div className="min-w-0 flex-1 pb-0.5">{props.leading}</div>
          <Button
            type="button"
            size="icon"
            variant={props.loading ? "secondary" : "default"}
            className="size-8 shrink-0"
            disabled={props.loading ? !props.onStop : !canSend}
            onClick={() => {
              if (props.loading) {
                props.onStop?.();
                return;
              }

              props.onSubmit();
            }}
          >
            {props.loading ? (
              <Square className="size-3.5 fill-current" />
            ) : (
              <ArrowUp className="size-4" />
            )}
            <span className="sr-only">
              {props.loading ? t("ai.stop") : t("ai.send")}
            </span>
          </Button>
        </TextareaGroupFooter>
      </TextareaGroup>
    </div>
  );
}
