import { TemplateTemplatesList } from "@hacado/types";
import { paymentLinksEmailTemplate as paymentLinksEmailTemplateEn } from "./en/payment-links-email";
import { paymentLinksSmsTemplate as paymentLinksSmsTemplateEn } from "./en/payment-links-sms";
import { paymentLinksEmailTemplate as paymentLinksEmailTemplateEs } from "./es/payment-links-email";
import { paymentLinksSmsTemplate as paymentLinksSmsTemplateEs } from "./es/payment-links-sms";
import { paymentLinksEmailTemplate as paymentLinksEmailTemplateFr } from "./fr/payment-links-email";
import { paymentLinksSmsTemplate as paymentLinksSmsTemplateFr } from "./fr/payment-links-sms";
import { paymentLinksEmailTemplate as paymentLinksEmailTemplateUk } from "./uk/payment-links-email";
import { paymentLinksSmsTemplate as paymentLinksSmsTemplateUk } from "./uk/payment-links-sms";

export const PaymentLinksTemplates: TemplateTemplatesList = {
  "payment-links-email": {
    en: paymentLinksEmailTemplateEn,
    fr: paymentLinksEmailTemplateFr,
    es: paymentLinksEmailTemplateEs,
    uk: paymentLinksEmailTemplateUk,
  },
  "payment-links-sms": {
    en: paymentLinksSmsTemplateEn,
    fr: paymentLinksSmsTemplateFr,
    es: paymentLinksSmsTemplateEs,
    uk: paymentLinksSmsTemplateUk,
  },
} as const;
