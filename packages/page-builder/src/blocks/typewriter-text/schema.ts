import { generateId } from "@hacado/builder/helpers";
import { BaseReaderBlockProps } from "@hacado/builder/reader";
import type { I18nFn } from "@hacado/i18n";
import { Prettify } from "@hacado/types/utils";
import * as z from "zod";
import { zStyles } from "./styles";

export const typewriterPhraseSchema = z.object({
  id: z.string().describe("Stable id for this phrase in the rotation"),
  text: z.string().describe("Text shown while this phrase is active"),
});

export type TypewriterPhrase = z.infer<typeof typewriterPhraseSchema>;

export const TypewriterTextPropsSchema = z.object({
  style: zStyles.describe(
    "Optional responsive styles. Keys must be from this block's supportedStyles; use getStyleSchema for value shapes.",
  ),
  props: z
    .object({
      phrases: z
        .array(typewriterPhraseSchema)
        .describe("Lines cycled with typewriter animation"),
      typeDelayMs: z.coerce
        .number()
        .min(0)
        .describe("Milliseconds between typed characters"),
      deleteDelayMs: z.coerce
        .number()
        .min(0)
        .describe("Milliseconds between deleted characters"),
      pauseAfterPhraseMs: z.coerce
        .number()
        .min(0)
        .describe("Pause after a full phrase before deleting"),
      showCursor: z.coerce
        .boolean()
        .describe("Show a blinking cursor while typing"),
    })
    .describe("Block configuration props"),
});

export type TypewriterTextProps = Prettify<
  z.infer<typeof TypewriterTextPropsSchema>
>;

export type TypewriterTextReaderProps = BaseReaderBlockProps<any> &
  TypewriterTextProps;

export { TypewriterTextPropsDefaults } from "./defaults";