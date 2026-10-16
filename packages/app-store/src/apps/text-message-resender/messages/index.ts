import { Language, resolveLanguageFromMap } from "@hacado/i18n";
import { EnTextMessageResenderMessages } from "./translations/en";
import { EsTextMessageResenderMessages } from "./translations/es";
import { FrTextMessageResenderMessages } from "./translations/fr";
import { UkTextMessageResenderMessages } from "./translations/uk";
import { TextMessageResenderMessage } from "./types";

export const TextMessageResenderMessages: Partial<
  Record<Language, TextMessageResenderMessage>
> = {
  en: EnTextMessageResenderMessages,
  fr: FrTextMessageResenderMessages,
  es: EsTextMessageResenderMessages,
  uk: UkTextMessageResenderMessages,
};

export function getTextMessageResenderMessages(language: Language) {
  return (
    resolveLanguageFromMap(TextMessageResenderMessages, language) ??
    TextMessageResenderMessages.en!
  );
}
