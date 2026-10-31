import { Language, resolveLanguageFromMap } from "@hacado/i18n";
import { EnCustomerTextMessageBodies } from "./translations/en";
import { EsCustomerTextMessageBodies } from "./translations/es";
import { FrCustomerTextMessageBodies } from "./translations/fr";
import { UkCustomerTextMessageBodies } from "./translations/uk";
import { CustomerTextMessageBodies } from "./types";

const messages: Partial<Record<Language, CustomerTextMessageBodies>> = {
  en: EnCustomerTextMessageBodies,
  es: EsCustomerTextMessageBodies,
  fr: FrCustomerTextMessageBodies,
  uk: UkCustomerTextMessageBodies,
};

export function getCustomerTextMessageBodies(language: Language) {
  return resolveLanguageFromMap(messages, language) ?? messages.en!;
}
