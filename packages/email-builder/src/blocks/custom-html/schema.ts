import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { Prettify } from "@hacado/types/utils";
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
        })
        .describe("Raw HTML markup injected into the email at render time."),
    })
    .optional()
    .nullable()
    .describe("Custom HTML block content."),
});

export type CustomHTMLProps = Prettify<z.infer<typeof CustomHTMLPropsSchema>>;
export type CustomHTMLReaderProps = BaseReaderBlockProps<any> & CustomHTMLProps;

export { CustomHTMLPropsDefaults } from "./defaults";
