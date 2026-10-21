"use client";

import { cn } from "@hacado/ui";
import { forwardRef, useId, useMemo } from "react";
import { phraseCycleTimeline } from "./motion";
import { PhraseMotion } from "./schema";

export type PhraseCycleClientProps = {
  className?: string;
  id?: string;
  phrases: { id: string; text: string }[];
  enterMotion: PhraseMotion;
  exitMotion: PhraseMotion;
  enterDurationMs: number;
  exitDurationMs: number;
  pauseAfterPhraseMs: number;
  onClick?: (e: React.MouseEvent<HTMLSpanElement>) => void;
};

export const PhraseCycleClient = forwardRef<
  HTMLSpanElement,
  PhraseCycleClientProps
>(
  (
    {
      className,
      id,
      phrases,
      enterMotion,
      exitMotion,
      enterDurationMs,
      exitDurationMs,
      pauseAfterPhraseMs,
      onClick,
    },
    ref,
  ) => {
    const animName = `pc${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
    const safePhrases = useMemo(
      () => phrases.filter((phrase) => phrase.text.length > 0),
      [phrases],
    );
    const timeline = useMemo(
      () =>
        phraseCycleTimeline(
          animName,
          safePhrases.length,
          enterMotion,
          exitMotion,
          enterDurationMs,
          pauseAfterPhraseMs,
          exitDurationMs,
        ),
      [
        animName,
        enterDurationMs,
        enterMotion,
        exitDurationMs,
        exitMotion,
        pauseAfterPhraseMs,
        safePhrases.length,
      ],
    );
    const cycling = safePhrases.length > 1;

    return (
      <span
        className={cn("inline-grid", animName, className)}
        id={id}
        ref={ref}
        onClick={onClick}
        aria-hidden={cycling ? true : undefined}
      >
        {cycling ? <style>{timeline.css}</style> : null}
        {(safePhrases.length
          ? safePhrases
          : [{ id: "empty", text: "\u00a0" }]
        ).map((phrase, index) => (
          <span
            key={phrase.id}
            className="phrase-cycle-word"
            style={
              cycling
                ? {
                    animation: `${animName} ${timeline.totalMs}ms linear ${index * timeline.slotMs}ms infinite both`,
                  }
                : undefined
            }
          >
            {phrase.text}
          </span>
        ))}
      </span>
    );
  },
);
