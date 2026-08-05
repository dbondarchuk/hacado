import { Language } from "@hacado/i18n";
import { giftCardStudioInvoiceTranslationsEn } from "./en/invoice";
import { giftCardStudioInvoiceTranslationsUk } from "./uk/invoice";

type GiftCardStudioInvoiceTranslations = Record<
  keyof typeof giftCardStudioInvoiceTranslationsEn,
  string
>;

export const giftCardStudioInvoiceTranslations: Record<
  Language,
  GiftCardStudioInvoiceTranslations
> = {
  en: giftCardStudioInvoiceTranslationsEn,
  uk: giftCardStudioInvoiceTranslationsUk,
} as const;
