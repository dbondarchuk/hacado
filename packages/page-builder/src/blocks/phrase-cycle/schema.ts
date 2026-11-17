import { generateId } from "@hacado/builder/helpers";
import { BaseReaderBlockProps } from "@hacado/builder/reader";
import type { I18nFn } from "@hacado/i18n";
import { Prettify } from "@hacado/types/utils";
import * as z from "zod";
import { zStyles } from "./styles";

export const phraseCyclePhraseSchema = z.object({
  id: z.string().describe("Stable id for this phrase in the cycle"),
  text: z.string().describe("Text shown while this phrase is visible"),
});

export type PhraseCyclePhrase = z.infer<typeof phraseCyclePhraseSchema>;

/** Direction the words travel. Enter starts off that side; exit continues that way. */
export const phraseMotions = [
  "fade",
  "fade-up",
  "fade-down",
  "fade-left",
  "fade-right",
] as const;

export const phraseMotionSchema = z
  .enum(phraseMotions)
  .describe("CSS-style motion preset for phrase enter/exit");
export type PhraseMotion = z.infer<typeof phraseMotionSchema>;

export const PhraseCyclePropsSchema = z.object({
  style: zStyles.describe(
    "Optional responsive styles. Keys must be from this block's supportedStyles; use getStyleSchema for value shapes.",
  ),
  props: z
    .object({
      phrases: z
        .array(phraseCyclePhraseSchema)
        .describe("Phrases rotated with enter/exit animations"),
      enterMotion: phraseMotionSchema.describe(
        "Animation when a phrase becomes visible",
      ),
      exitMotion: phraseMotionSchema.describe(
        "Animation when a phrase leaves",
      ),
      enterDurationMs: z.coerce
        .number()
        .min(0)
        .describe("Duration of the enter animation in ms"),
      exitDurationMs: z.coerce
        .number()
        .min(0)
        .describe("Duration of the exit animation in ms"),
      pauseAfterPhraseMs: z.coerce
        .number()
        .min(0)
        .describe("How long each phrase stays fully visible"),
    })
    .describe("Block configuration props"),
});

export type PhraseCycleProps = Prettify<z.infer<typeof PhraseCyclePropsSchema>>;
export type PhraseCycleReaderProps = BaseReaderBlockProps<any> &
  PhraseCycleProps;

export { PhraseCyclePropsDefaults } from "./defaults";