import { BaseReaderBlockProps } from "@hacado/builder";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import * as z from "zod";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const InlineContainerPropsSchema = z.object({
  style: zStyles,
  props: z.object({
    children: z.array(z.any()),
  }),
});

export type InlineContainerProps = z.infer<typeof InlineContainerPropsSchema>;
export type InlineContainerReaderProps = BaseReaderBlockProps<any> &
  InlineContainerProps;

export const InlineContainerPropsDefaults = {
  style: {
    padding: [
      {
        value: {
          top: { value: 0, unit: "rem" },
          bottom: { value: 0, unit: "rem" },
          left: { value: 0, unit: "rem" },
          right: { value: 0, unit: "rem" },
        },
      },
    ],
    display: [
      {
        value: "inline-flex",
      },
    ],
    flexDirection: [
      {
        value: "row",
      },
    ],
    alignItems: [
      {
        value: "center",
      },
    ],
    justifyContent: [
      {
        value: "center",
      },
    ],
    gap: [
      {
        value: {
          value: 0.5,
          unit: "rem",
        },
      },
    ],
  },
  props: {
    children: [],
  },
} as const satisfies InlineContainerProps;
