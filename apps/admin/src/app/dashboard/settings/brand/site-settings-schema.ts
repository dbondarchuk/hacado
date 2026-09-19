import {
  brandConfigurationSchema,
  generalConfigurationSchema,
  Prettify,
  socialConfigurationSchema,
  stylingConfigurationSchema,
} from "@hacado/types";
import * as z from "zod";

export const siteSettingsFormSchema = z.object({
  general: generalConfigurationSchema,
  brand: brandConfigurationSchema,
  social: socialConfigurationSchema,
  styling: stylingConfigurationSchema,
});

export type SiteSettingsFormValues = Prettify<
  z.infer<typeof siteSettingsFormSchema>
>;
