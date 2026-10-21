import { PhraseMotion } from "./schema";

/** Where the word sits at the start of an enter, or the end of an exit. */
const ENTER_FROM: Record<PhraseMotion, string> = {
  fade: "none",
  "fade-up": "translateY(0.7em)",
  "fade-down": "translateY(-0.7em)",
  "fade-left": "translateX(0.7em)",
  "fade-right": "translateX(-0.7em)",
};

const EXIT_TO: Record<PhraseMotion, string> = {
  fade: "none",
  "fade-up": "translateY(-0.7em)",
  "fade-down": "translateY(0.7em)",
  "fade-left": "translateX(-0.7em)",
  "fade-right": "translateX(0.7em)",
};

export type PhraseCycleTimeline = {
  totalMs: number;
  slotMs: number;
  css: string;
};

/**
 * One looping keyframe shared by every phrase. Each phrase delays by its slot
 * so the words hand off without React replacing the text.
 */
export function phraseCycleTimeline(
  animationName: string,
  count: number,
  enterMotion: PhraseMotion,
  exitMotion: PhraseMotion,
  enterMs: number,
  holdMs: number,
  exitMs: number,
): PhraseCycleTimeline {
  const slotMs = Math.max(enterMs + holdMs + exitMs, 1);
  const totalMs = slotMs * Math.max(count, 1);
  const at = (ms: number) => (ms / totalMs) * 100;
  let enterEnd = at(enterMs);
  let holdEnd = at(enterMs + holdMs);
  let slotEnd = at(slotMs);
  if (enterEnd < 0.01) enterEnd = 0.01;
  if (holdEnd < enterEnd + 0.01) holdEnd = enterEnd + 0.01;
  if (slotEnd < holdEnd + 0.01) slotEnd = holdEnd + 0.01;
  if (slotEnd > 99.99) slotEnd = 99.99;
  const enterFrom = ENTER_FROM[enterMotion];
  const exitTo = EXIT_TO[exitMotion];
  const css = `@keyframes ${animationName} {
  0% { opacity: 0; transform: ${enterFrom}; animation-timing-function: ease; }
  ${enterEnd}% { opacity: 1; transform: none; animation-timing-function: linear; }
  ${holdEnd}% { opacity: 1; transform: none; animation-timing-function: ease; }
  ${slotEnd}%, 100% { opacity: 0; transform: ${exitTo}; animation-timing-function: linear; }
}
.${animationName} > .phrase-cycle-word {
  grid-area: 1 / 1;
  white-space: nowrap;
}`;

  return { totalMs, slotMs, css };
}
