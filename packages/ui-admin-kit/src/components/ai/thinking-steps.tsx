"use client";

import { useI18n } from "@hacado/i18n/client";
import { cn } from "@hacado/ui/cn";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@hacado/ui/collapsible";
import { ChevronDown, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

export function AiThinkingSteps(props: {
  steps: string[];
  active?: boolean;
  defaultOpen?: boolean;
  elapsedLabel?: string;
}) {
  const t = useI18n("admin");
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
            {t("ai.working")}
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
          t("ai.thoughtProcess")
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
