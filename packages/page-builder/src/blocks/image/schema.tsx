import { BaseReaderBlockProps } from "@hacado/builder";
import { Prettify } from "@hacado/types";
import * as z from "zod";
import { zStyles } from "./styles";

export const ImagePropsSchema = z.object({
  style: zStyles.optional().nullable(),
  props: z
    .object({
      src: z.string().optional().nullable(),
      alt: z.string().optional().nullable(),
      linkHref: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type ImageProps = Prettify<z.infer<typeof ImagePropsSchema>>;
export type ImageReaderProps = BaseReaderBlockProps<any> & ImageProps;

export const ImagePropsDefaults = {
  props: {
    src: "/assets/placeholder/400x200.jpg",
    alt: "Sample image",
    linkHref: null,
  },
  style: {
    textAlign: [
      {
        value: "center",
      },
    ],
    objectFit: [
      {
        value: "cover",
      },
    ],
    objectPosition: [
      {
        value: { x: 50, y: 50 },
      },
    ],
    verticalAlign: [
      {
        value: "middle",
      },
    ],
    maxWidth: [
      {
        value: {
          value: 100,
          unit: "%",
        },
      },
    ],
    display: [
      {
        value: "inline-block",
      },
    ],
    textDecoration: [
      {
        value: "none",
      },
    ],
  },
} as const satisfies ImageProps;
