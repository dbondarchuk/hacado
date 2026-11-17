import * as z from "zod";
import { zPadding, zTextAlign } from "../../style-inputs/helpers/zod";

export const shape = z
  .enum(["circle", "square", "rounded"])
  .describe("Avatar crop shape");
export type AvatarShape = z.infer<typeof shape>;

export const AvatarPropsSchema = z.object({
  style: z
    .object({
      textAlign: zTextAlign.describe("Horizontal alignment of the avatar"),
      padding: zPadding.describe("Padding around the avatar"),
    })
    .optional()
    .nullable()
    .describe("Optional avatar layout styles"),
  props: z
    .object({
      size: z.coerce
        .number<number>()
        .gt(0)
        .int("emailBuilder.blocks.avatar.validation.size")
        .optional()
        .nullable()
        .describe("Avatar diameter/size in pixels"),
      shape: shape.optional().nullable(),
      imageUrl: z
        .string()
        .optional()
        .nullable()
        .describe("Avatar image source URL"),
      alt: z
        .string()
        .optional()
        .nullable()
        .describe("Accessible alt text for the avatar image"),
    })
    .optional()
    .nullable()
    .describe("Block configuration props"),
});

export type AvatarProps = z.infer<typeof AvatarPropsSchema>;

export { AvatarPropsDefaults } from "./defaults";