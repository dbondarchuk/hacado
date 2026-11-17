import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { Prettify } from "@hacado/types/utils";
import { iconNames } from "@hacado/ui/icon";
import * as z from "zod";
import { zStyles } from "./styles";

const iconsEnum = z.enum(iconNames);

export const IconPropsSchema = z.object({
  props: z
    .object({
      icon: iconsEnum
        .optional()
        .nullable()
        .describe("Icon name from the design system icon set"),
    })
    .optional()
    .nullable()
    .describe("Block configuration props"),
  style: zStyles.describe(
    "Optional responsive styles. Keys must be from this block's supportedStyles; use getStyleSchema for value shapes.",
  ),
});

export type IconProps = Prettify<z.infer<typeof IconPropsSchema>>;
export type IconReaderProps = BaseReaderBlockProps<any> & IconProps;

export { IconPropsDefaults } from "./defaults";