import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { Prettify } from "@hacado/types/utils";
import * as z from "zod";
import { zStyles } from "./styles";

export const CustomHTMLPropsSchema = z.object({
  props: z
    .object({
      html: z
        .string({
          error: "builder.pageBuilder.blocks.customHtml.errors.required",
        })
        .min(1, {
          message: "builder.pageBuilder.blocks.customHtml.errors.required",
        })
        .describe("Raw HTML markup injected into the page"),
    })
    .optional()
    .nullable()
    .describe("Block configuration props"),
  style: zStyles.describe(
    "Optional responsive styles. Keys must be from this block's supportedStyles; use getStyleSchema for value shapes.",
  ),
});

export type CustomHTMLProps = Prettify<z.infer<typeof CustomHTMLPropsSchema>>;
export type CustomHTMLReaderProps = BaseReaderBlockProps<any> & CustomHTMLProps;

export { CustomHTMLPropsDefaults } from "./defaults";
