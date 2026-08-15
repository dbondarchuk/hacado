import { BaseReaderBlockProps } from "@hacado/builder";
import { Prettify } from "@hacado/types";
import * as z from "zod";

export const overlayType = ["blur", "default"] as const;

export const LightboxPropsSchema = z.object({
  props: z.object({
    overlay: z.enum(overlayType),
    showAltAsDescription: z.coerce.boolean<boolean>().optional().nullable(),
    navigation: z.coerce.boolean<boolean>().optional().nullable(),
    loop: z.coerce.boolean<boolean>().optional().nullable(),
    autoPlay: z.coerce
      .number<number>()
      .positive()
      .min(1)
      .max(30)
      .optional()
      .nullable(),
    children: z.array(z.any()),
  }),
});

export type LightboxProps = Prettify<z.infer<typeof LightboxPropsSchema>>;
export type LightboxReaderProps = BaseReaderBlockProps<any> & LightboxProps;

export const LightboxPropsDefaults = {
  props: {
    overlay: "default",
    showAltAsDescription: true,
    navigation: true,
    loop: true,
    autoPlay: null,
    children: [],
  },
} as const satisfies LightboxProps;
