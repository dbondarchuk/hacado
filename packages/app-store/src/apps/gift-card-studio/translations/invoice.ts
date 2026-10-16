import { Language, resolveLanguageFromMap } from "@hacado/i18n";
import { giftCardStudioInvoiceTranslationsEn } from "./en/invoice";
import { giftCardStudioInvoiceTranslationsEs } from "./es/invoice";
import { giftCardStudioInvoiceTranslationsFr } from "./fr/invoice";
import { giftCardStudioInvoiceTranslationsUk } from "./uk/invoice";

type GiftCardStudioInvoiceTranslations = Record<
  keyof typeof giftCardStudioInvoiceTranslationsEn,
  string
>;

export const giftCardStudioInvoiceTranslations: Partial<
  Record<Language, GiftCardStudioInvoiceTranslations>
> = {
  en: giftCardStudioInvoiceTranslationsEn,
  fr: giftCardStudioInvoiceTranslationsFr,
  es: giftCardStudioInvoiceTranslationsEs,
  uk: giftCardStudioInvoiceTranslationsUk,
};

export function getGiftCardStudioInvoiceTranslations(language: Language) {
  return (
    resolveLanguageFromMap(giftCardStudioInvoiceTranslations, language) ??
    giftCardStudioInvoiceTranslations.en!
  );
}
