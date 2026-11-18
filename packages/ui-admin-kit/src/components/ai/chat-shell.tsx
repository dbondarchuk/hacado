"use client";

import { cn } from "@hacado/ui/cn";
import { ScrollArea } from "@hacado/ui/scroll-area";
import { useEffect, useRef, type ReactNode } from "react";

export function AiChatShell(props: {
  title?: ReactNode;
  emptyHint?: ReactNode;
  isEmpty?: boolean;
  messages: ReactNode;
  composer: ReactNode;
  /** Extra content below messages (e.g. global apply error). */
  afterMessages?: ReactNode;
  className?: string;
  /** Dependencies that should scroll the transcript to the bottom. */
  scrollDeps?: unknown[];
}) {
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) return;

    viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
  }, props.scrollDeps ?? []);

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden pt-2",
        props.className,
      )}
    >
      {props.title ? (
        <div className="flex shrink-0 items-center gap-2 px-1 pb-3 pt-1 text-sm font-medium">
          {props.title}
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <ScrollArea
          className="absolute inset-0 h-full"
          viewportRef={viewportRef}
        >
          <div className="flex flex-col gap-4 px-1 pb-2">
            {props.isEmpty ? (
              <div className="text-muted-foreground px-1 text-xs leading-relaxed">
                {props.emptyHint}
              </div>
            ) : null}
            {props.messages}
            {props.afterMessages}
          </div>
        </ScrollArea>
      </div>

      {props.composer}
    </div>
  );
}
