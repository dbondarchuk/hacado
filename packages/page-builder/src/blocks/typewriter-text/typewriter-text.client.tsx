"use client";

import { cn } from "@hacado/ui";
import { forwardRef, useEffect, useMemo, useState } from "react";

export type TypewriterTextClientProps = {
  className?: string;
  id?: string;
  phrases: { id: string; text: string }[];
  typeDelayMs: number;
  deleteDelayMs: number;
  pauseAfterPhraseMs: number;
  showCursor: boolean;
  onClick?: (e: React.MouseEvent<HTMLSpanElement>) => void;
};

type Phase = "typing" | "deleting";

export const TypewriterTextClient = forwardRef<
  HTMLSpanElement,
  TypewriterTextClientProps
>(
  (
    {
      className,
      id,
      phrases,
      typeDelayMs,
      deleteDelayMs,
      pauseAfterPhraseMs,
      showCursor,
      onClick,
    },
    ref,
  ) => {
    const safePhrases = useMemo(
      () => phrases.filter((p) => p.text.length > 0),
      [phrases],
    );

    const [phraseIndex, setPhraseIndex] = useState(0);
    const [displayText, setDisplayText] = useState("");
    const [phase, setPhase] = useState<Phase>("typing");

    const currentPhrase = safePhrases[phraseIndex]?.text ?? "";
    const longest = useMemo(() => {
      if (!safePhrases.length) return "";
      return safePhrases.reduce(
        (acc, p) => (p.text.length > acc.length ? p.text : acc),
        safePhrases[0]!.text,
      );
    }, [safePhrases]);

    useEffect(() => {
      if (!safePhrases.length) return;
      setPhraseIndex((i) => Math.min(i, safePhrases.length - 1));
    }, [safePhrases.length]);

    useEffect(() => {
      if (!safePhrases.length || !currentPhrase.length) return;

      const { delayMs, action } = (() => {
        if (phase === "typing") {
          if (displayText.length < currentPhrase.length) {
            return {
              delayMs: typeDelayMs,
              action: () =>
                setDisplayText(currentPhrase.slice(0, displayText.length + 1)),
            };
          }
          return {
            delayMs: pauseAfterPhraseMs,
            action: () => setPhase("deleting"),
          };
        }
        if (phase === "deleting") {
          if (displayText.length > 0) {
            return {
              delayMs: deleteDelayMs,
              action: () => setDisplayText((t) => t.slice(0, -1)),
            };
          }
          return {
            delayMs: 0,
            action: () => {
              setPhraseIndex((i) => (i + 1) % safePhrases.length);
              setPhase("typing");
            },
          };
        }
        return { delayMs: 0, action: () => {} };
      })();

      const timer = window.setTimeout(action, delayMs);
      return () => window.clearTimeout(timer);
    }, [
      currentPhrase,
      deleteDelayMs,
      displayText,
      pauseAfterPhraseMs,
      phase,
      phraseIndex,
      safePhrases.length,
      typeDelayMs,
    ]);

    if (!safePhrases.length) {
      return (
        <span className={className} id={id} ref={ref} onClick={onClick}>
          {"\u00a0"}
        </span>
      );
    }

    return (
      <span
        className={cn("inline-grid", className)}
        id={id}
        ref={ref}
        onClick={onClick}
      >
        <span className="invisible col-start-1 row-start-1">{longest}</span>
        <span className="col-start-1 row-start-1">
          {displayText || "\u00a0"}
          {showCursor ? (
            <span
              className="ml-1 inline-block h-[1em] w-[3px] animate-blink align-middle bg-current opacity-80"
              aria-hidden
            />
          ) : null}
        </span>
      </span>
    );
  },
);
