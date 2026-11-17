"use client";

import { useI18n } from "@hacado/i18n/client";
import { cn } from "@hacado/ui/cn";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@hacado/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export type BuilderAIApplyError = {
  message: string;
  details?: string;
};

export function BuilderAIApplyErrorCard(props: {
  error: BuilderAIApplyError;
  className?: string;
}) {
  const t = useI18n("builder");
  const [open, setOpen] = useState(false);
  const details = props.error.details?.trim();

  return (
    <div
      className={cn(
        "border-destructive/40 bg-destructive/5 text-destructive rounded-md border p-2 text-xs",
        props.className,
      )}
    >
      <div className="font-medium">{props.error.message}</div>
      {details ? (
        <Collapsible open={open} onOpenChange={setOpen} className="mt-1">
          <CollapsibleTrigger className="text-destructive/80 hover:text-destructive inline-flex items-center gap-1 underline-offset-2 hover:underline">
            {open ? t("ai.hideErrorDetails") : t("ai.showErrorDetails")}
            <ChevronDown
              className={cn(
                "size-3 transition-transform",
                open && "rotate-180",
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <pre className="bg-background/70 text-foreground max-h-40 overflow-auto rounded-md p-2 whitespace-pre-wrap break-words">
              {details}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  );
}
