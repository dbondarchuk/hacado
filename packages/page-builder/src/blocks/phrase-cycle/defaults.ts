import { generateId } from "@hacado/builder/helpers";
import type { I18nFn } from "@hacado/i18n";
import type { PhraseCycleProps } from "./schema";

export const PhraseCyclePropsDefaults = (
  _t: I18nFn<undefined, undefined>,
): PhraseCycleProps => ({
  style: {},
  props: {
    phrases: [
      { id: generateId(), text: "independent studios" },
      { id: generateId(), text: "nail artists" },
      { id: generateId(), text: "hair stylists" },
    ],
    enterMotion: "fade-up",
    exitMotion: "fade-up",
    enterDurationMs: 450,
    exitDurationMs: 400,
    pauseAfterPhraseMs: 1600,
  },
}) as const satisfies PhraseCycleProps;
