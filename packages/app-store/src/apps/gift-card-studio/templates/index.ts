import { TemplateTemplatesList } from "@hacado/types";
import { giftCardToCustomerEmailTemplate as giftCardToCustomerEmailTemplateEn } from "./en/gift-card-to-customer";
import { giftCardToRecipientEmailTemplate as giftCardToRecipientEmailTemplateEn } from "./en/gift-card-to-recipient";
import { giftCardToCustomerEmailTemplate as giftCardToCustomerEmailTemplateEs } from "./es/gift-card-to-customer";
import { giftCardToRecipientEmailTemplate as giftCardToRecipientEmailTemplateEs } from "./es/gift-card-to-recipient";
import { giftCardToCustomerEmailTemplate as giftCardToCustomerEmailTemplateFr } from "./fr/gift-card-to-customer";
import { giftCardToRecipientEmailTemplate as giftCardToRecipientEmailTemplateFr } from "./fr/gift-card-to-recipient";
import { giftCardToCustomerEmailTemplate as giftCardToCustomerEmailTemplateUk } from "./uk/gift-card-to-customer";
import { giftCardToRecipientEmailTemplate as giftCardToRecipientEmailTemplateUk } from "./uk/gift-card-to-recipient";

export const GiftCardStudioTemplates: TemplateTemplatesList = {
  "gift-card-studio-customer-email": {
    en: giftCardToCustomerEmailTemplateEn,
    fr: giftCardToCustomerEmailTemplateFr,
    es: giftCardToCustomerEmailTemplateEs,
    uk: giftCardToCustomerEmailTemplateUk,
  },
  "gift-card-studio-recipient-email": {
    en: giftCardToRecipientEmailTemplateEn,
    fr: giftCardToRecipientEmailTemplateFr,
    es: giftCardToRecipientEmailTemplateEs,
    uk: giftCardToRecipientEmailTemplateUk,
  },
} as const;
