import { Language, resolveLanguageFromMap } from "@hacado/i18n";
import { InboundSmsKeyword } from "../compliance";

const helpMessages: Partial<Record<Language, string>> = {
  en: "Appointment texts for your bookings. Support: support@hacado.com.",
  es: "Textos de citas para tus reservas. Soporte: support@hacado.com.",
  fr: "Textos de rendez-vous pour vos reservations. Support: support@hacado.com.",
  uk: "Тексти про записи. Підтримка: support@hacado.com.",
};

const stopMessages: Partial<Record<Language, string>> = {
  en: "You will not receive more texts. Reply START to opt back in.",
  es: "No recibirás más textos. Responde START para volver a recibirlos.",
  fr: "Vous ne recevrez plus de textos. Répondez START pour les réactiver.",
  uk: "Ви більше не отримуватимете повідомлення. Надішліть START, щоб увімкнути їх знову.",
};

const startMessages: Partial<Record<Language, string>> = {
  en: "You will receive appointment texts again. Reply STOP to cancel.",
  es: "Volverás a recibir textos de citas. Responde STOP para cancelar.",
  fr: "Vous recevrez à nouveau les textos de rendez-vous. Répondez STOP pour annuler.",
  uk: "Ви знову отримуватимете повідомлення про записи. Надішліть STOP, щоб скасувати.",
};

const readMessage = (
  messages: Partial<Record<Language, string>>,
  language: Language,
) => resolveLanguageFromMap(messages, language) ?? messages.en!;

export function getHelpSms(language: Language = "en") {
  return readMessage(helpMessages, language);
}

export function getStopSms(language: Language = "en") {
  return readMessage(stopMessages, language);
}

export function getStartSms(language: Language = "en") {
  return readMessage(startMessages, language);
}

export function getInboundSmsKeywordReply(
  keyword: InboundSmsKeyword,
  language: Language = "en",
) {
  if (keyword === "stop") {
    return getStopSms(language);
  }

  if (keyword === "start") {
    return getStartSms(language);
  }

  return getHelpSms(language);
}
