import { BaseReaderBlockProps } from "@hacado/builder";
import * as z from "zod";
import { zColorNullable, zStylesBase } from "../../style-inputs/helpers/zod";

export const ContainerPropsSchema = z.object({
  style: z
    .object({
      ...zStylesBase.pick({ backgroundColor: true, padding: true }).shape,
      borderColor: zColorNullable,
      borderRadius: z.coerce
        .number<number>()
        .int("emailBuilder.common.container.validation.borderRadius")
        .optional()
        .nullable(),
    })
    .optional()
    .nullable(),
  props: z.object({
    children: z.array(z.any()),
  }),
});

export type ContainerProps = z.infer<typeof ContainerPropsSchema>;
export type ContainerReaderProps = BaseReaderBlockProps<any> & ContainerProps;

export const ContainerPropsDefaults = {
  style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
  props: {
    children: [],
  },
} satisfies ContainerProps;
