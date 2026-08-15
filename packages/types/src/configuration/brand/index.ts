import { languages } from "@hacado/i18n";
import * as z from "zod";
import { asOptionalField, zAssetName, zNonEmptyString } from "../../utils";

export const brandConfigurationSchema = z.object({
  title: zNonEmptyString(
    "configuration.brand.title.min",
    3,
    64,
    "configuration.brand.title.max",
  ),
  description: zNonEmptyString(
    "configuration.brand.description.min",
    3,
    1024,
    "configuration.brand.description.max",
  ),
  keywords: zNonEmptyString(
    "configuration.brand.keywords.min",
    3,
    1024,
    "configuration.brand.keywords.max",
  ),
  logo: asOptionalField(zAssetName),
  favicon: asOptionalField(zAssetName),
  language: z.enum(languages, {
    error: "configuration.brand.language.invalid",
  }),
});

export type BrandConfiguration = z.infer<typeof brandConfigurationSchema>;
