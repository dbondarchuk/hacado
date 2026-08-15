import { BaseReaderBlockProps } from "@hacado/builder";
import { Prettify } from "@hacado/types";
import * as z from "zod";
import { zStyles } from "./styles";

export const InlineTextPropsSchema = z.object({
  props: z
    .object({
      text: z.any().optional().nullable(),
      // url: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  style: zStyles,
});

export type InlineTextProps = Prettify<z.infer<typeof InlineTextPropsSchema>>;
export type InlineTextReaderProps = BaseReaderBlockProps<any> & InlineTextProps;

export const InlineTextPropsDefaults = {
  props: {
    text: "Hello friend",
  },
  style: {},
} as const satisfies InlineTextProps;
