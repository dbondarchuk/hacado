import { BaseReaderBlockProps, generateId } from "@hacado/builder";
import type { I18nFn } from "@hacado/i18n";
import { Prettify } from "@hacado/types";
import * as z from "zod";
import { zStyles } from "./styles";

export const typewriterPhraseSchema = z.object({
  id: z.string(),
  text: z.string(),
});

export type TypewriterPhrase = z.infer<typeof typewriterPhraseSchema>;

export const TypewriterTextPropsSchema = z.object({
  style: zStyles,
  props: z.object({
    phrases: z.array(typewriterPhraseSchema),
    typeDelayMs: z.coerce.number().min(0),
    deleteDelayMs: z.coerce.number().min(0),
    pauseAfterPhraseMs: z.coerce.number().min(0),
    showCursor: z.coerce.boolean(),
  }),
});

export type TypewriterTextProps = Prettify<
  z.infer<typeof TypewriterTextPropsSchema>
>;
export type TypewriterTextReaderProps = BaseReaderBlockProps<any> &
  TypewriterTextProps;

export const TypewriterTextPropsDefaults = (
  _t: I18nFn<undefined, undefined>,
): TypewriterTextProps => ({
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
});
