import { TemplateTemplatesList } from "@hacado/types";
import { packageCancelledEmailTemplate as packageCancelledEmailTemplateEn } from "./en/cancelled";
import { packageExhaustedEmailTemplate as packageExhaustedEmailTemplateEn } from "./en/exhausted";
import { packageExpiredEmailTemplate as packageExpiredEmailTemplateEn } from "./en/expired";
import { packageExpiringSoonEmailTemplate as packageExpiringSoonEmailTemplateEn } from "./en/expiring-soon";
import { packagePurchasedEmailTemplate as packagePurchasedEmailTemplateEn } from "./en/purchased";
import { packageCancelledEmailTemplate as packageCancelledEmailTemplateUk } from "./uk/cancelled";
import { packageExhaustedEmailTemplate as packageExhaustedEmailTemplateUk } from "./uk/exhausted";
import { packageExpiredEmailTemplate as packageExpiredEmailTemplateUk } from "./uk/expired";
import { packageExpiringSoonEmailTemplate as packageExpiringSoonEmailTemplateUk } from "./uk/expiring-soon";
import { packagePurchasedEmailTemplate as packagePurchasedEmailTemplateUk } from "./uk/purchased";

export const CustomerPackageEmailNotificationTemplates: TemplateTemplatesList =
  {
    "customer-package-purchased-email": {
      en: packagePurchasedEmailTemplateEn,
      uk: packagePurchasedEmailTemplateUk,
    },
    "customer-package-exhausted-email": {
      en: packageExhaustedEmailTemplateEn,
      uk: packageExhaustedEmailTemplateUk,
    },
    "customer-package-cancelled-email": {
      en: packageCancelledEmailTemplateEn,
      uk: packageCancelledEmailTemplateUk,
    },
    "customer-package-expired-email": {
      en: packageExpiredEmailTemplateEn,
      uk: packageExpiredEmailTemplateUk,
    },
    "customer-package-expiring-soon-email": {
      en: packageExpiringSoonEmailTemplateEn,
      uk: packageExpiringSoonEmailTemplateUk,
    },
  } as const;
