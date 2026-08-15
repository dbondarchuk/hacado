import { AppointmentStatusToICalMethodMap } from "@hacado/utils";

export type EmailTemplate = {
  title: string;
  text: string;
  previewText?: string;
};

export type EmailTemplates = {
  [key in
    | keyof typeof AppointmentStatusToICalMethodMap
    | "cancelledByCustomer"
    | "rescheduledByCustomer"
    | "auto-confirmed"]: EmailTemplate;
} & {
  subject: string;
  eventTitle: string;
  buttonTexts: Record<"viewAppointment" | "decline" | "confirm", string>;
};
