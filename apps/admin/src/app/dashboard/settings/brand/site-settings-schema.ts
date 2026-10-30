import { brandConfigurationSchema } from "@hacado/types/configuration/brand";
import { generalConfigurationSchema } from "@hacado/types/configuration/general";
import { socialConfigurationSchema } from "@hacado/types/configuration/social";
import { stylingConfigurationSchema } from "@hacado/types/configuration/styling";
import { Prettify } from "@hacado/types/utils";
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
