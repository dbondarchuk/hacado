import { TemplateTemplatesList } from "@hacado/types";
import { appointmentReminderEmailTemplate as appointmentReminderEmailTemplateEn } from "./en/emailReminder";
import { appointmentReminderTextMessageTemplate as appointmentReminderTextMessageTemplateEn } from "./en/textMessageReminder";
import { appointmentReminderEmailTemplate as appointmentReminderEmailTemplateUk } from "./uk/emailReminder";
import { appointmentReminderTextMessageTemplate as appointmentReminderTextMessageTemplateUk } from "./uk/textMessageReminder";

export const AppointmentNotificationsTemplates: TemplateTemplatesList = {
  "appointment-reminder-text-message": {
    en: appointmentReminderTextMessageTemplateEn,
    uk: appointmentReminderTextMessageTemplateUk,
  },
  "appointment-reminder-email": {
    en: appointmentReminderEmailTemplateEn,
    uk: appointmentReminderEmailTemplateUk,
  },
} as const;
