import { TemplateTemplatesList } from "@hacado/types/templates";
import { appointmentReminderEmailTemplate as appointmentReminderEmailTemplateEn } from "./en/emailReminder";
import { appointmentReminderTextMessageTemplate as appointmentReminderTextMessageTemplateEn } from "./en/textMessageReminder";
import { appointmentReminderEmailTemplate as appointmentReminderEmailTemplateEs } from "./es/emailReminder";
import { appointmentReminderTextMessageTemplate as appointmentReminderTextMessageTemplateEs } from "./es/textMessageReminder";
import { appointmentReminderEmailTemplate as appointmentReminderEmailTemplateFr } from "./fr/emailReminder";
import { appointmentReminderTextMessageTemplate as appointmentReminderTextMessageTemplateFr } from "./fr/textMessageReminder";
import { appointmentReminderEmailTemplate as appointmentReminderEmailTemplateUk } from "./uk/emailReminder";
import { appointmentReminderTextMessageTemplate as appointmentReminderTextMessageTemplateUk } from "./uk/textMessageReminder";

export const AppointmentNotificationsTemplates: TemplateTemplatesList = {
  "appointment-reminder-text-message": {
    en: appointmentReminderTextMessageTemplateEn,
    fr: appointmentReminderTextMessageTemplateFr,
    es: appointmentReminderTextMessageTemplateEs,
    uk: appointmentReminderTextMessageTemplateUk,
  },
  "appointment-reminder-email": {
    en: appointmentReminderEmailTemplateEn,
    fr: appointmentReminderEmailTemplateFr,
    es: appointmentReminderEmailTemplateEs,
    uk: appointmentReminderEmailTemplateUk,
  },
} as const;
