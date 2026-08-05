import { BaseReaderBlockProps } from "@hacado/builder";
import { Prettify } from "@hacado/types";
import { iconNames } from "@hacado/ui";
import * as z from "zod";
import { zStyles } from "./styles";

const iconsEnum = z.enum(iconNames);

export const IconPropsSchema = z.object({
  props: z
    .object({
      icon: iconsEnum.optional().nullable(),
    })
    .optional()
    .nullable(),
  style: zStyles,
});

export type IconProps = Prettify<z.infer<typeof IconPropsSchema>>;
export type IconReaderProps = BaseReaderBlockProps<any> & IconProps;

export const IconPropsDefaults = {
  props: {
    icon: "star",
  },
  style: {
    display: [
      {
        value: "inline-block",
      },
    ],
    width: [
      {
        value: { value: 1, unit: "rem" },
      },
    ],
    height: [
      {
        value: { value: 1, unit: "rem" },
      },
    ],
    fill: [
      {
        value: "transparent",
      },
    ],
  },
} as const satisfies IconProps;
