import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { Prettify } from "@hacado/types/utils";
import * as z from "zod";
import { catalogSources, durationFormats, durationStyles } from "./properties";
import { zStyles } from "./styles";

export const CatalogValuePropsSchema = z.object({
  props: z
    .object({
      source: z
        .enum(catalogSources)
        .optional()
        .nullable()
        .describe("Catalog entity type to read from (service, product, etc.)"),
      itemId: z
        .string()
        .optional()
        .nullable()
        .describe("ID of the catalog item to display"),
      property: z
        .string()
        .optional()
        .nullable()
        .describe("Which field on the item to render (name, price, duration, etc.)"),
      stripFormatting: z
        .boolean()
        .optional()
        .nullable()
        .describe("Remove rich formatting from text values when true"),
      alwaysShowCents: z
        .boolean()
        .optional()
        .nullable()
        .describe("Always show decimal cents on price values"),
      showCurrency: z
        .boolean()
        .optional()
        .nullable()
        .describe("Include currency symbol with price values"),
      durationFormat: z
        .enum(durationFormats)
        .optional()
        .nullable()
        .describe("How to format duration numbers (minutes, hours, etc.)"),
      durationStyle: z
        .enum(durationStyles)
        .optional()
        .nullable()
        .describe("Visual style for rendered duration text"),
    })
    .optional()
    .nullable()
    .describe("Block configuration props"),
  style: zStyles.describe(
    "Optional responsive styles. Keys must be from this block's supportedStyles; use getStyleSchema for value shapes.",
  ),
});

export type CatalogValueProps = Prettify<
  z.infer<typeof CatalogValuePropsSchema>
>;

export type CatalogValueReaderProps = BaseReaderBlockProps<any> &
  CatalogValueProps;

export { CatalogValuePropsDefaults } from "./defaults";