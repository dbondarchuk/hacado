import { BaseReaderBlockProps } from "@hacado/builder";
import * as z from "zod";
import { zStyles } from "./styles";

export const WaitlistPropsSchema = z.object({
  style: zStyles,
  props: z.object({}),
});

export type WaitlistProps = z.infer<typeof WaitlistPropsSchema>;
export type WaitlistReaderProps = BaseReaderBlockProps<any> & WaitlistProps;

export const WaitlistPropsDefaults = {
  style: {
    display: [
      {
        value: "grid",
      },
    ],
    gridTemplateColumns: [
      {
        value: "1fr",
      },
      {
        value: "repeat(2, 1fr)",
        breakpoint: ["md"],
      },
      {
        value: "repeat(3, 1fr)",
        breakpoint: ["lg"],
      },
    ],
    alignItems: [
      {
        value: "stretch",
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
          value: 2.5,
          unit: "rem",
        },
      },
    ],
  },
  props: {},
} as const satisfies WaitlistProps;
