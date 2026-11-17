import * as z from "zod";
import { zStyles } from "../../style-inputs/helpers/zod";

export const HeadingPropsSchema = z.object({
  props: z
    .object({
      text: z
        .string()
        .optional()
        .nullable()
        .describe("Heading title text."),
      level: z
        .enum(["h1", "h2", "h3"])
        .optional()
        .nullable()
        .describe("Semantic heading level (largest to smallest)."),
    })
    .optional()
    .nullable()
    .describe("Heading text and level."),
  style: zStyles.describe(
    "Typography, colors, spacing, and alignment for the heading.",
  ),
});

export type HeadingProps = z.infer<typeof HeadingPropsSchema>;

export { HeadingPropsDefaults } from "./defaults";