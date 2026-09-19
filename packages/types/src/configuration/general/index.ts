import * as z from "zod";
import { asOptionalField, zEmail, zNonEmptyString, zPhone } from "../../utils";
import { zBusinessIndustry } from "../../utils/business-industry";
import { zCountry } from "../../utils/country";
import { zCurrency } from "../../utils/currency";
import { zPostalAddress } from "../../utils/postal-address";
import { zTimeZone } from "../../utils/zTimeZone";

export const generalConfigurationSchema = z.object({
  name: zNonEmptyString(
    "configuration.general.name.min",
    3,
    64,
    "configuration.general.name.max",
  ),
  /** Business industry for JSON-LD LocalBusiness subtype and template suggestions. */
  industry: asOptionalField(zBusinessIndustry),
  phone: asOptionalField(zPhone),
  email: zEmail,
  /** Physical address (schema.org PostalAddress). */
  address: asOptionalField(zPostalAddress),
  country: zCountry,
  currency: zCurrency,
  timeZone: zTimeZone,
  useClientTimezone: z.coerce.boolean<boolean>().optional(),
  /** Display label override for the `coordinator` role (e.g. Front Desk). */
  coordinatorLabel: asOptionalField(
    z.string().max(64, "configuration.general.coordinatorLabel.max"),
  ),
});

export type GeneralConfiguration = z.infer<typeof generalConfigurationSchema>;
