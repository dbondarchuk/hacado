import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { Prettify } from "@hacado/types/utils";
import * as z from "zod";
import { zStyles } from "./styles";

export const ButtonType = z.enum(["action", "link"]);

export const ButtonPropsSchema = z.object({
  props: z
    .discriminatedUnion("type", [
      z.object({
        type: z
          .literal("action")
          .describe("Button runs a built-in or custom action"),
        action: z
          .string({
            error: "pageBuilder.blocks.button.errors.action",
          })
          .describe("Action identifier (e.g. close-modal, submit)"),
        actionData: z
          .any()
          .optional()
          .nullable()
          .describe("Optional JSON payload passed to the action handler"),
        children: z
          .array(z.any())
          .describe(
            "Inline label children only (InlineContainer → InlineText). Never nest Text here.",
          ),
      }),
      z.object({
        type: z
          .literal("link")
          .optional()
          .nullable()
          .describe("Button navigates like a link"),
        children: z
          .array(z.any())
          .describe(
            "Inline label children only (InlineContainer → InlineText). Never nest Text here.",
          ),
        url: z
          .string()
          .optional()
          .nullable()
          .describe("Destination URL when used as a link"),
        target: z
          .enum(["_self", "_blank"])
          .optional()
          .nullable()
          .describe("Link target window"),
      }),
    ])
    .optional()
    .nullable()
    .describe("Block configuration props"),
  style: zStyles.describe(
    "Optional responsive styles. Keys must be from this block's supportedStyles; use getStyleSchema for value shapes.",
  ),
});

export type ButtonProps = Prettify<z.infer<typeof ButtonPropsSchema>>;
export type ButtonReaderProps = BaseReaderBlockProps<any> & ButtonProps;

export {
  ButtonDefaultAction,
  ButtonDefaultTarget,
  ButtonDefaultUrl,
  ButtonPropsDefaults,
} from "./defaults";
