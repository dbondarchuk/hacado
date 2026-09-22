import { TemplateTemplatesList } from "@hacado/types";
import { paymentLinksEmailTemplate as paymentLinksEmailTemplateEn } from "./en/payment-links-email";
import { paymentLinksSmsTemplate as paymentLinksSmsTemplateEn } from "./en/payment-links-sms";
import { paymentLinksEmailTemplate as paymentLinksEmailTemplateUk } from "./uk/payment-links-email";
import { paymentLinksSmsTemplate as paymentLinksSmsTemplateUk } from "./uk/payment-links-sms";

export const PaymentLinksTemplates: TemplateTemplatesList = {
  "payment-links-email": {
    en: paymentLinksEmailTemplateEn,
    uk: paymentLinksEmailTemplateUk,
  },
  "payment-links-sms": {
    en: paymentLinksSmsTemplateEn,
    uk: paymentLinksSmsTemplateUk,
  },
} as const;
