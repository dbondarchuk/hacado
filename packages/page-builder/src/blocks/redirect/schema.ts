import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { Prettify, zNonEmptyString } from "@hacado/types/utils";
import * as z from "zod";

export const RedirectPropsSchema = z.object({
  props: z
    .object({
      url: zNonEmptyString("pageBuilder.blocks.redirect.errors.url").describe(
        "Target URL or path for the redirect",
      ),
      permanent: z
        .boolean()
        .optional()
        .nullable()
        .describe("Use a permanent (301) redirect when true"),
    })
    .optional()
    .nullable()
    .describe("Block configuration props"),
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
