import type { AllKeys } from "@hacado/i18n";

export type AIToolStepPhase = "start" | "done";

/** Progress step while an AI tool runs (host SSE / UI). */
export type AIToolStepEvent = {
  type: "step";
  id: string;
  label: string;
  /** Full AllKeys for unnamespaced `useI18n()`. */
  labelKey?: AllKeys;
  tool?: string;
  phase: AIToolStepPhase;
};

export type AITextDeltaEvent = {
  type: "text-delta";
  text: string;
};

/** Shared AI stream events for Builder, Blog, and other consumers. */
export type AIStreamEvent = AIToolStepEvent | AITextDeltaEvent;
