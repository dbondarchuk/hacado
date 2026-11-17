import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import { Prettify } from "@hacado/types/utils";
import * as z from "zod";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const MyCabinetBlockPropsSchema = z.object({
  props: z
    .object({
      showTitle: z
        .boolean()
        .optional()
        .nullable()
        .describe("Show the customer cabinet page title."),
      scrollToTop: z
        .boolean()
        .optional()
        .nullable()
        .describe("Scroll to the top when navigating within the cabinet."),
    })
    .optional()
    .nullable()
    .describe("Block configuration props"),
  style: zStyles.describe(
    "Optional responsive styles for layout, spacing, colors, and typography.",
  ),
});

export type MyCabinetBlockProps = Prettify<
  z.infer<typeof MyCabinetBlockPropsSchema>
>;

export type MyCabinetBlockReaderProps = BaseReaderBlockProps<any> &
  MyCabinetBlockProps;

export const MyCabinetBlockPropsDefaults = {
  props: {
    showTitle: true,
    scrollToTop: true,
  },
  style: {},
} as const satisfies MyCabinetBlockProps;