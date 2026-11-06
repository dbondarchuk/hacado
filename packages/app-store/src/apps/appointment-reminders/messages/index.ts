import { Language, resolveLanguageFromMap } from "@hacado/i18n";
import { EnAppointmentReminderSms } from "./translations/en";
import { EsAppointmentReminderSms } from "./translations/es";
import { FrAppointmentReminderSms } from "./translations/fr";
import { UkAppointmentReminderSms } from "./translations/uk";

const messages: Partial<Record<Language, string>> = {
  en: EnAppointmentReminderSms,
  es: EsAppointmentReminderSms,
  fr: FrAppointmentReminderSms,
  uk: UkAppointmentReminderSms,
};

export function getAppointmentReminderSms(language: Language) {
  return resolveLanguageFromMap(messages, language) ?? messages.en!;
}
