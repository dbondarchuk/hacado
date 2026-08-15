import { BaseReaderBlockProps } from "@hacado/builder";
import { Prettify } from "@hacado/types";
import * as z from "zod";
import { zStyles } from "./styles";

export const TextPropsSchema = z.object({
  props: z
    .object({
      value: z.any().optional().nullable(),
    })
    .optional()
    .nullable(),
  style: zStyles,
});

export type TextProps = Prettify<z.infer<typeof TextPropsSchema>>;
export type TextReaderProps = BaseReaderBlockProps<any> & TextProps;

export const TextPropsDefaults = {
  props: {
    value: [],
  },
  style: {
    padding: [
      {
        value: {
          top: {
            value: 1,
            unit: "rem",
          },
          bottom: {
            value: 1,
            unit: "rem",
          },
          left: {
            value: 1.5,
            unit: "rem",
          },
          right: {
            value: 1.5,
            unit: "rem",
          },
        },
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
  },
} as const satisfies TextProps;
