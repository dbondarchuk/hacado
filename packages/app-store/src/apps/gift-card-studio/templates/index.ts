import { TemplateTemplatesList } from "@hacado/types";
import { giftCardToCustomerEmailTemplate as giftCardToCustomerEmailTemplateEn } from "./en/gift-card-to-customer";
import { giftCardToRecipientEmailTemplate as giftCardToRecipientEmailTemplateEn } from "./en/gift-card-to-recipient";
import { giftCardToCustomerEmailTemplate as giftCardToCustomerEmailTemplateUk } from "./uk/gift-card-to-customer";
import { giftCardToRecipientEmailTemplate as giftCardToRecipientEmailTemplateUk } from "./uk/gift-card-to-recipient";

export const GiftCardStudioTemplates: TemplateTemplatesList = {
  "gift-card-studio-customer-email": {
    en: giftCardToCustomerEmailTemplateEn,
    uk: giftCardToCustomerEmailTemplateUk,
  },
  "gift-card-studio-recipient-email": {
    en: giftCardToRecipientEmailTemplateEn,
    uk: giftCardToRecipientEmailTemplateUk,
  },
} as const;
