import { Language } from "@hacado/i18n";

export type MyAppointmentNotificationsMessage = {
  pending: string;
  confirmed: string;
  declined: string;
  canceled: string;
  noShow: string;
  rescheduled: string;
  unknownAppointment: string;
  unknownOption: string;
  appointmentConfirmed: string;
  appointmentDeclined: string;
};

export type MyAppointmentNotificationsMessages = Partial<
  Record<Language, MyAppointmentNotificationsMessage>
>;
