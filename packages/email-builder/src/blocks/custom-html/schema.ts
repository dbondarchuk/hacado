import { BaseReaderBlockProps } from "@hacado/builder";
import { Prettify } from "@hacado/types";
import * as z from "zod";

export const CustomHTMLPropsSchema = z.object({
  props: z
    .object({
      html: z
        .string({
          error: "emailBuilder.blocks.customHtml.errors.required",
        })
        .min(1, {
          message: "emailBuilder.blocks.customHtml.errors.required",
        }),
    })
    .optional()
    .nullable(),
});

export type CustomHTMLProps = Prettify<z.infer<typeof CustomHTMLPropsSchema>>;
export type CustomHTMLReaderProps = BaseReaderBlockProps<any> & CustomHTMLProps;

export const CustomHTMLPropsDefaults = {
  props: {
    html: "",
  },
} as const satisfies CustomHTMLProps;
