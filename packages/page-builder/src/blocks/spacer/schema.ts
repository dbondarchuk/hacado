import { BaseReaderBlockProps } from "@hacado/builder";
import * as z from "zod";
import { zStyles } from "./styles";

export const SpacerPropsSchema = z.object({
  style: zStyles.optional().nullable(),
  props: z.object({}).optional().nullable(),
});

export type SpacerProps = z.infer<typeof SpacerPropsSchema>;
export type SpacerReaderProps = BaseReaderBlockProps<any> & SpacerProps;

export const SpacerPropsDefaults = {
  style: {
    height: [
      {
        breakpoint: [],
        state: [],
        value: {
          value: 1,
          unit: "rem",
        },
      },
    ],
    display: [
      {
        breakpoint: [],
        state: [],
        value: "block",
      },
    ],
  },
} satisfies SpacerProps;
