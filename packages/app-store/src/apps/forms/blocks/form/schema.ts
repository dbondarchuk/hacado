import { BaseReaderBlockProps } from "@hacado/builder";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import { Prettify } from "@hacado/types";
import * as z from "zod";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const FormBlockPropsSchema = z.object({
  props: z
    .object({
      formId: z.string().nullable().optional(),
    })
    .optional()
    .nullable(),
  style: zStyles,
});

export type FormBlockProps = Prettify<z.infer<typeof FormBlockPropsSchema>>;
export type FormBlockReaderProps = BaseReaderBlockProps<any> & FormBlockProps;

export const FormBlockPropsDefaults = {
  props: {
    formId: null as string | null,
  },
  style: {
    padding: [
      {
        value: {
          top: { value: 1, unit: "rem" },
          bottom: { value: 1, unit: "rem" },
          left: { value: 1.5, unit: "rem" },
          right: { value: 1.5, unit: "rem" },
        },
      },
    ],
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
} as const satisfies FormBlockProps;
