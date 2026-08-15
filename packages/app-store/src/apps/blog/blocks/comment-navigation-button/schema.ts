import { BaseReaderBlockProps } from "@hacado/builder";
import {
  ALL_STYLES,
  COLORS,
  getStylesSchema,
} from "@hacado/page-builder-base/style";
import * as z from "zod";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const BlogCommentNavigationButtonPropsSchema = z.object({
  props: z.object({
    direction: z.enum(["prev", "next"]),
  }),
  style: zStyles,
});

export type BlogCommentNavigationButtonProps = z.infer<
  typeof BlogCommentNavigationButtonPropsSchema
>;
export type BlogCommentNavigationButtonReaderProps = BaseReaderBlockProps<any> &
  BlogCommentNavigationButtonProps;

export const BlogCommentNavigationButtonPropsDefaults = {
  props: {
    direction: "prev",
  },
  style: {
    color: [
      {
        value: COLORS["primary-foreground"].value,
      },
    ],
    padding: [
      {
        value: {
          top: { value: 0.75, unit: "rem" },
          right: { value: 1.5, unit: "rem" },
          bottom: { value: 0.75, unit: "rem" },
          left: { value: 1.5, unit: "rem" },
        },
      },
    ],
    backgroundColor: [
      {
        value: COLORS["primary"].value,
      },
    ],
    filter: [
      {
        value: "brightness(1.1)",
        state: [
          { state: "hover", target: { type: "self" } },
          { state: "focus", target: { type: "self" } },
          { state: "active", target: { type: "self" } },
        ],
      },
    ],
    transition: [
      {
        value: "all 0.3s ease",
      },
    ],
    fontSize: [
      {
        value: {
          value: 1,
          unit: "rem",
        },
      },
    ],
    fontWeight: [
      {
        value: "normal",
      },
    ],
    textAlign: [
      {
        value: "center",
      },
    ],
    display: [
      {
        value: "inline-flex",
      },
    ],
  },
} as const satisfies BlogCommentNavigationButtonProps;
