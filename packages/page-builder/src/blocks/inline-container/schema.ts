import { BaseReaderBlockProps } from "@hacado/builder/reader";
import {
  backgroundVideoStyle,
  getAllStylesWithAdditionalStyles,
  getStylesSchema,
} from "@hacado/page-builder-base/style";
import * as z from "zod";

export const styles = getAllStylesWithAdditionalStyles({
  backgroundVideo: backgroundVideoStyle,
});

export const zStyles = getStylesSchema(styles);

export const InlineContainerPropsSchema = z.object({
  style: zStyles.describe(
    "Optional responsive styles. Keys must be from this block's supportedStyles; use getStyleSchema for value shapes.",
  ),
  props: z
    .object({
      children: z.array(z.any()).describe("Inline-level child blocks"),
    })
    .describe("Block configuration props"),
});

export type InlineContainerProps = z.infer<typeof InlineContainerPropsSchema>;
export type InlineContainerReaderProps = BaseReaderBlockProps<any> &
  InlineContainerProps;

export { InlineContainerPropsDefaults } from "./defaults";
