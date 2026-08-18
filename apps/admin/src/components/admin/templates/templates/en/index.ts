import { TemplatesTemplate } from "@hacado/types";
import { appointmentCanceledEmailTemplate } from "./email/appointment-canceled";
import { appointmentConfirmedEmailTemplate } from "./email/appointment-confirmed";
import { appointmentCreatedEmailTemplate } from "./email/appointment-created";
import { appointmentDeclinedEmailTemplate } from "./email/appointment-declined";
import { appointmentNoShowEmailTemplate } from "./email/appointment-no-show";
import { appointmentRescheduledEmailTemplate } from "./email/appointment-rescheduled";
import { customerOtpEmailTemplate } from "./email/customer-otp";
import { appointmentCanceledTextMessageTemplate } from "./text-message/appointment-canceled";
import { appointmentConfirmedTextMessageTemplate } from "./text-message/appointment-confirmed";
import { appointmentCreatedTextMessageTemplate } from "./text-message/appointment-created";
import { appointmentDeclinedTextMessageTemplate } from "./text-message/appointment-declined";
import { appointmentNoShowTextMessageTemplate } from "./text-message/appointment-no-show";
import { appointmentRescheduledTextMessageTemplate } from "./text-message/appointment-rescheduled";
import { autoReplyTextMessageTemplate } from "./text-message/auto-reply";
import { customerOtpTextTemplate } from "./text-message/customer-otp";

export const enTemplates: Record<string, TemplatesTemplate> = {
  "customer-otp-email": customerOtpEmailTemplate,
  "customer-otp-text": customerOtpTextTemplate,
  "appointment-created-email": appointmentCreatedEmailTemplate,
  "appointment-declined-email": appointmentDeclinedEmailTemplate,
  "appointment-canceled-email": appointmentCanceledEmailTemplate,
  "appointment-no-show-email": appointmentNoShowEmailTemplate,
  "appointment-confirmed-email": appointmentConfirmedEmailTemplate,
  "appointment-rescheduled-email": appointmentRescheduledEmailTemplate,
  "appointment-created-text-message": appointmentCreatedTextMessageTemplate,
  "appointment-declined-text-message": appointmentDeclinedTextMessageTemplate,
  "appointment-canceled-text-message": appointmentCanceledTextMessageTemplate,
  "appointment-no-show-text-message": appointmentNoShowTextMessageTemplate,
  "appointment-confirmed-text-message": appointmentConfirmedTextMessageTemplate,
  "appointment-rescheduled-text-message":
    appointmentRescheduledTextMessageTemplate,
  "auto-reply-text-message": autoReplyTextMessageTemplate,
};
