import { TemplateTemplatesList } from "@hacado/types";
import { packageCancelledEmailTemplate as packageCancelledEmailTemplateEn } from "./en/cancelled";
import { packageExhaustedEmailTemplate as packageExhaustedEmailTemplateEn } from "./en/exhausted";
import { packageExpiredEmailTemplate as packageExpiredEmailTemplateEn } from "./en/expired";
import { packageExpiringSoonEmailTemplate as packageExpiringSoonEmailTemplateEn } from "./en/expiring-soon";
import { packagePurchasedEmailTemplate as packagePurchasedEmailTemplateEn } from "./en/purchased";
import { packageCancelledEmailTemplate as packageCancelledEmailTemplateEs } from "./es/cancelled";
import { packageExhaustedEmailTemplate as packageExhaustedEmailTemplateEs } from "./es/exhausted";
import { packageExpiredEmailTemplate as packageExpiredEmailTemplateEs } from "./es/expired";
import { packageExpiringSoonEmailTemplate as packageExpiringSoonEmailTemplateEs } from "./es/expiring-soon";
import { packagePurchasedEmailTemplate as packagePurchasedEmailTemplateEs } from "./es/purchased";
import { packageCancelledEmailTemplate as packageCancelledEmailTemplateFr } from "./fr/cancelled";
import { packageExhaustedEmailTemplate as packageExhaustedEmailTemplateFr } from "./fr/exhausted";
import { packageExpiredEmailTemplate as packageExpiredEmailTemplateFr } from "./fr/expired";
import { packageExpiringSoonEmailTemplate as packageExpiringSoonEmailTemplateFr } from "./fr/expiring-soon";
import { packagePurchasedEmailTemplate as packagePurchasedEmailTemplateFr } from "./fr/purchased";
import { packageCancelledEmailTemplate as packageCancelledEmailTemplateUk } from "./uk/cancelled";
import { packageExhaustedEmailTemplate as packageExhaustedEmailTemplateUk } from "./uk/exhausted";
import { packageExpiredEmailTemplate as packageExpiredEmailTemplateUk } from "./uk/expired";
import { packageExpiringSoonEmailTemplate as packageExpiringSoonEmailTemplateUk } from "./uk/expiring-soon";
import { packagePurchasedEmailTemplate as packagePurchasedEmailTemplateUk } from "./uk/purchased";

export const CustomerPackageEmailNotificationTemplates: TemplateTemplatesList =
  {
    "customer-package-purchased-email": {
      en: packagePurchasedEmailTemplateEn,
      fr: packagePurchasedEmailTemplateFr,
      es: packagePurchasedEmailTemplateEs,
      uk: packagePurchasedEmailTemplateUk,
    },
    "customer-package-exhausted-email": {
      en: packageExhaustedEmailTemplateEn,
      fr: packageExhaustedEmailTemplateFr,
      es: packageExhaustedEmailTemplateEs,
      uk: packageExhaustedEmailTemplateUk,
    },
    "customer-package-cancelled-email": {
      en: packageCancelledEmailTemplateEn,
      fr: packageCancelledEmailTemplateFr,
      es: packageCancelledEmailTemplateEs,
      uk: packageCancelledEmailTemplateUk,
    },
    "customer-package-expired-email": {
      en: packageExpiredEmailTemplateEn,
      fr: packageExpiredEmailTemplateFr,
      es: packageExpiredEmailTemplateEs,
      uk: packageExpiredEmailTemplateUk,
    },
    "customer-package-expiring-soon-email": {
      en: packageExpiringSoonEmailTemplateEn,
      fr: packageExpiringSoonEmailTemplateFr,
      es: packageExpiringSoonEmailTemplateEs,
      uk: packageExpiringSoonEmailTemplateUk,
    },
  } as const;
