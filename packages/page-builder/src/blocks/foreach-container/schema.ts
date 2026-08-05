import { BaseReaderBlockProps } from "@hacado/builder";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import { asOptionalField, asOptinalNumberField } from "@hacado/types";
import * as z from "zod";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const ForeachContainerPropsSchema = z.object({
  props: z.object({
    value: z
      .string()
      .min(1, "pageBuilder.blocks.foreachContainer.errors.value"),
    itemName: asOptionalField(
      z
        .string()
        .regex(
          /^[a-zA-Z_$][a-zA-Z_$0-9]*$/,
          "pageBuilder.blocks.foreachContainer.errors.itemName",
        ),
    ),
    skip: asOptinalNumberField(
      z
        .number()
        .int()
        .min(0, "pageBuilder.blocks.foreachContainer.errors.skip"),
    ),
    take: asOptinalNumberField(
      z
        .number()
        .int()
        .min(0, "pageBuilder.blocks.foreachContainer.errors.take"),
    ),
    children: z.array(z.any()),
  }),
  style: zStyles,
});

export type ForeachContainerProps = z.infer<typeof ForeachContainerPropsSchema>;
export type ForeachContainerReaderProps = BaseReaderBlockProps<any> &
  ForeachContainerProps;

export const ForeachContainerPropsDefaults = {
  props: {
    value: "",
    children: [],
  },
  style: {
    display: [
      {
        value: "flex",
      },
    ],
    flexDirection: [
      {
        value: "column",
      },
    ],
    width: [
      {
        value: { value: 100, unit: "%" },
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
} satisfies ForeachContainerProps;
