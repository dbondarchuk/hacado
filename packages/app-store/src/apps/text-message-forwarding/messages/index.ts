import { Language, resolveLanguageFromMap } from "@hacado/i18n";
import { EnTextMessageForwardingMessages } from "./translations/en";
import { EsTextMessageForwardingMessages } from "./translations/es";
import { FrTextMessageForwardingMessages } from "./translations/fr";
import { UkTextMessageForwardingMessages } from "./translations/uk";
import { TextMessageForwardingMessage } from "./types";

export const TextMessageForwardingMessages: Partial<
  Record<Language, TextMessageForwardingMessage>
> = {
  en: EnTextMessageForwardingMessages,
  fr: FrTextMessageForwardingMessages,
  es: EsTextMessageForwardingMessages,
  uk: UkTextMessageForwardingMessages,
};

export function getTextMessageForwardingMessages(language: Language) {
  return (
    resolveLanguageFromMap(TextMessageForwardingMessages, language) ??
    TextMessageForwardingMessages.en!
  );
}
