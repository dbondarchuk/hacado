import * as z from "zod";
import { zStyles } from "../../style-inputs/helpers/zod";

export const TextPropsSchema = z.object({
  style: zStyles,
  props: z
    .object({
      value: z.any().optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type TextProps = z.infer<typeof TextPropsSchema>;

export const TextPropsDefaults = {
  props: { value: [{ type: "p", children: [{ text: "" }] }] },
  style: {
    padding: { top: 16, bottom: 16, left: 24, right: 24 },
    fontWeight: "normal",
  },
} satisfies TextProps;
