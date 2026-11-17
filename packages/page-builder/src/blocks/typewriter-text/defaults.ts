import { generateId } from "@hacado/builder/helpers";
import type { I18nFn } from "@hacado/i18n";
import type { TypewriterTextProps } from "./schema";

export const TypewriterTextPropsDefaults = (
  _t: I18nFn<undefined, undefined>,
): TypewriterTextProps =>
  ({
    style: {},
    props: {
      phrases: [
        { id: generateId(), text: "what you love" },
        { id: generateId(), text: "your clients" },
        { id: generateId(), text: "growing your business" },
      ],
      typeDelayMs: 100,
      deleteDelayMs: 50,
      pauseAfterPhraseMs: 2000,
      showCursor: true,
    },
  }) as const satisfies TypewriterTextProps;
