import { Language, resolveLanguageFromMap } from "@hacado/i18n";

const helpMessages: Partial<Record<Language, string>> = {
  en: "Appointment texts for your bookings. Support: support@hacado.com.",
  es: "Textos de citas para tus reservas. Soporte: support@hacado.com.",
  fr: "Textos de rendez-vous pour vos reservations. Support: support@hacado.com.",
  uk: "Тексти про записи. Підтримка: support@hacado.com.",
};

export function getHelpSms(language: Language = "en") {
  return resolveLanguageFromMap(helpMessages, language) ?? helpMessages.en!;
}
