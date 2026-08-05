import { BaseReaderBlockProps } from "@hacado/builder";
import { Prettify, zNonEmptyString } from "@hacado/types";
import * as z from "zod";

export const RedirectPropsSchema = z.object({
  props: z
    .object({
      url: zNonEmptyString("pageBuilder.blocks.redirect.errors.url"),
      permanent: z.boolean().optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type RedirectProps = Prettify<z.infer<typeof RedirectPropsSchema>>;
export type RedirectReaderProps = BaseReaderBlockProps<any> & RedirectProps;

export const RedirectDefaultUrl = "/";

export const RedirectPropsDefaults = () =>
  ({
    props: {
      url: RedirectDefaultUrl,
      permanent: false,
    },
  }) as const satisfies RedirectProps;
