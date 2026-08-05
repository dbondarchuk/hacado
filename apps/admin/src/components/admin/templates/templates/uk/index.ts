import { TemplatesTemplate } from "@hacado/types";
import { appointmentConfirmedEmailTemplate } from "./email/appointment-confirmed";
import { appointmentCreatedEmailTemplate } from "./email/appointment-created";
import { appointmentDeclinedEmailTemplate } from "./email/appointment-declined";
import { appointmentRescheduledEmailTemplate } from "./email/appointment-rescheduled";
import { appointmentConfirmedTextMessageTemplate } from "./text-message/appointment-confirmed";
import { appointmentCreatedTextMessageTemplate } from "./text-message/appointment-created";
import { appointmentDeclinedTextMessageTemplate } from "./text-message/appointment-declined";
import { appointmentRescheduledTextMessageTemplate } from "./text-message/appointment-rescheduled";
import { autoReplyTextMessageTemplate } from "./text-message/auto-reply";
import { customerOtpEmailTemplate } from "./email/customer-otp";
import { customerOtpTextTemplate } from "./text-message/customer-otp";

export const ukTemplates: Record<string, TemplatesTemplate> = {
  "customer-otp-email": customerOtpEmailTemplate,
  "customer-otp-text": customerOtpTextTemplate,
  "appointment-created-email": appointmentCreatedEmailTemplate,
  "appointment-declined-email": appointmentDeclinedEmailTemplate,
  "appointment-confirmed-email": appointmentConfirmedEmailTemplate,
  "appointment-rescheduled-email": appointmentRescheduledEmailTemplate,
  "appointment-created-text-message": appointmentCreatedTextMessageTemplate,
  "appointment-declined-text-message": appointmentDeclinedTextMessageTemplate,
  "appointment-confirmed-text-message": appointmentConfirmedTextMessageTemplate,
  "appointment-rescheduled-text-message":
    appointmentRescheduledTextMessageTemplate,
  "auto-reply-text-message": autoReplyTextMessageTemplate,
};
