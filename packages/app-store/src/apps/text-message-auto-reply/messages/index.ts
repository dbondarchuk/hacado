import { Language, resolveLanguageFromMap } from "@hacado/i18n";

const messages: Partial<Record<Language, string>> = {
  en: "This number is not monitored. It sends appointment texts for {{config.name}}.",
  es: "Este numero no esta monitoreado. Envia textos de citas de {{config.name}}.",
  fr: "Ce numero n'est pas surveille. Il envoie les textos de rendez-vous de {{config.name}}.",
  uk: "Цей номер не обслуговується. Він надсилає тексти про записи від {{config.name}}.",
};

export function getAutoReplySms(language: Language) {
  return resolveLanguageFromMap(messages, language) ?? messages.en!;
}
