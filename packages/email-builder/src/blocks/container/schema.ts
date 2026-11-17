import { BaseReaderBlockProps } from "@hacado/builder/reader";
import * as z from "zod";
import { zColorNullable, zPadding } from "../../style-inputs/helpers/zod";

export const ContainerPropsSchema = z.object({
  style: z
    .object({
      backgroundColor: zColorNullable.describe(
        "Background fill inside the container.",
      ),
      padding: zPadding
        .optional()
        .nullable()
        .describe("Inner padding around container content."),
      borderColor: zColorNullable.describe("Border color around the container."),
      borderRadius: z.coerce
        .number<number>()
        .int("emailBuilder.common.container.validation.borderRadius")
        .optional()
        .nullable()
        .describe("Corner radius of the container in pixels."),
    })
    .optional()
    .nullable()
    .describe("Background, padding, and border styling for the container."),
  props: z
    .object({
      children: z
        .array(z.any())
        .describe("Nested blocks inside the container."),
    })
    .describe("Container structure and child blocks."),
});

export type ContainerProps = z.infer<typeof ContainerPropsSchema>;
export type ContainerReaderProps = BaseReaderBlockProps<any> & ContainerProps;

export { ContainerPropsDefaults } from "./defaults";