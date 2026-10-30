import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { Prettify } from "@hacado/types/utils";
import * as z from "zod";
import { catalogSources, durationFormats, durationStyles } from "./properties";
import { zStyles } from "./styles";

export const CatalogValuePropsSchema = z.object({
  props: z
    .object({
      source: z.enum(catalogSources).optional().nullable(),
      itemId: z.string().optional().nullable(),
      property: z.string().optional().nullable(),
      stripFormatting: z.boolean().optional().nullable(),
      alwaysShowCents: z.boolean().optional().nullable(),
      showCurrency: z.boolean().optional().nullable(),
      durationFormat: z.enum(durationFormats).optional().nullable(),
      durationStyle: z.enum(durationStyles).optional().nullable(),
    })
    .optional()
    .nullable(),
  style: zStyles,
});

export type CatalogValueProps = Prettify<
  z.infer<typeof CatalogValuePropsSchema>
>;
export type CatalogValueReaderProps = BaseReaderBlockProps<any> &
  CatalogValueProps;

export const CatalogValuePropsDefaults = {
  props: {
    source: "service",
    itemId: null,
    property: "name",
    stripFormatting: false,
    alwaysShowCents: false,
    showCurrency: false,
    durationFormat: "hoursMinutes",
    durationStyle: "medium",
  },
  style: {},
} as const satisfies CatalogValueProps;
