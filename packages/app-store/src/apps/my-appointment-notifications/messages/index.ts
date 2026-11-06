import { Language, resolveLanguageFromMap } from "@hacado/i18n";
import { EnMyAppointmentNotificationsMessages } from "./translations/en";
import { EsMyAppointmentNotificationsMessages } from "./translations/es";
import { FrMyAppointmentNotificationsMessages } from "./translations/fr";
import { UkMyAppointmentNotificationsMessages } from "./translations/uk";
import { MyAppointmentNotificationsMessage } from "./types";

export const MyAppointmentNotificationsMessages: Partial<
  Record<Language, MyAppointmentNotificationsMessage>
> = {
  en: EnMyAppointmentNotificationsMessages,
  fr: FrMyAppointmentNotificationsMessages,
  es: EsMyAppointmentNotificationsMessages,
  uk: UkMyAppointmentNotificationsMessages,
};

export function getMyAppointmentNotificationsMessages(language: Language) {
  return (
    resolveLanguageFromMap(MyAppointmentNotificationsMessages, language) ??
    MyAppointmentNotificationsMessages.en!
  );
}
