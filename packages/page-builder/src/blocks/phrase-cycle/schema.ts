import { BaseReaderBlockProps, generateId } from "@hacado/builder";
import type { I18nFn } from "@hacado/i18n";
import { Prettify } from "@hacado/types";
import * as z from "zod";
import { zStyles } from "./styles";

export const phraseCyclePhraseSchema = z.object({
  id: z.string(),
  text: z.string(),
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

export const phraseMotionSchema = z.enum(phraseMotions);
export type PhraseMotion = z.infer<typeof phraseMotionSchema>;

export const PhraseCyclePropsSchema = z.object({
  style: zStyles,
  props: z.object({
    phrases: z.array(phraseCyclePhraseSchema),
    enterMotion: phraseMotionSchema,
    exitMotion: phraseMotionSchema,
    enterDurationMs: z.coerce.number().min(0),
    exitDurationMs: z.coerce.number().min(0),
    pauseAfterPhraseMs: z.coerce.number().min(0),
  }),
});

export type PhraseCycleProps = Prettify<z.infer<typeof PhraseCyclePropsSchema>>;
export type PhraseCycleReaderProps = BaseReaderBlockProps<any> &
  PhraseCycleProps;

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
});
