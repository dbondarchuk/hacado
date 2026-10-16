import { Language, resolveLanguageFromMap } from "@hacado/i18n";
import { EnTextMessageNotificationMessages } from "./translations/en";
import { EsTextMessageNotificationMessages } from "./translations/es";
import { FrTextMessageNotificationMessages } from "./translations/fr";
import { UkTextMessageNotificationMessages } from "./translations/uk";
import { TextMessageNotificationMessage } from "./types";

export const TextMessageNotificationMessages: Partial<
  Record<Language, TextMessageNotificationMessage>
> = {
  en: EnTextMessageNotificationMessages,
  fr: FrTextMessageNotificationMessages,
  es: EsTextMessageNotificationMessages,
  uk: UkTextMessageNotificationMessages,
};

export function getTextMessageNotificationMessages(language: Language) {
  return (
    resolveLanguageFromMap(TextMessageNotificationMessages, language) ??
    TextMessageNotificationMessages.en!
  );
}
