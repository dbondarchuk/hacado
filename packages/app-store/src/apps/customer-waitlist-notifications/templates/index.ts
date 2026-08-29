import { TemplateTemplatesList } from "@hacado/types";
import { waitlistEntryCreatedEmailTemplate as waitlistEntryCreatedEmailTemplateEn } from "../../waitlist/templates/en/waitlist-entry-created";
import { waitlistEntryCreatedEmailTemplate as waitlistEntryCreatedEmailTemplateUk } from "../../waitlist/templates/uk/waitlist-entry-created";
import { waitlistLeaveConfirmTextMessageTemplate as waitlistLeaveConfirmTextMessageTemplateEn } from "./en/waitlist-leave-confirm-text-message";
import { waitlistSlotOpenedEmailTemplate as waitlistSlotOpenedEmailTemplateEn } from "./en/waitlist-slot-opened-email";
import { waitlistSlotOpenedTextMessageTemplate as waitlistSlotOpenedTextMessageTemplateEn } from "./en/waitlist-slot-opened-text-message";
import { waitlistLeaveConfirmTextMessageTemplate as waitlistLeaveConfirmTextMessageTemplateUk } from "./uk/waitlist-leave-confirm-text-message";
import { waitlistSlotOpenedEmailTemplate as waitlistSlotOpenedEmailTemplateUk } from "./uk/waitlist-slot-opened-email";
import { waitlistSlotOpenedTextMessageTemplate as waitlistSlotOpenedTextMessageTemplateUk } from "./uk/waitlist-slot-opened-text-message";

export const CustomerWaitlistNotificationsTemplates: TemplateTemplatesList = {
  "waitlist-entry-created-email": {
    en: waitlistEntryCreatedEmailTemplateEn,
    uk: waitlistEntryCreatedEmailTemplateUk,
  },
  "waitlist-slot-opened-email": {
    en: waitlistSlotOpenedEmailTemplateEn,
    uk: waitlistSlotOpenedEmailTemplateUk,
  },
  "waitlist-slot-opened-text-message": {
    en: waitlistSlotOpenedTextMessageTemplateEn,
    uk: waitlistSlotOpenedTextMessageTemplateUk,
  },
  "waitlist-leave-confirm-text-message": {
    en: waitlistLeaveConfirmTextMessageTemplateEn,
    uk: waitlistLeaveConfirmTextMessageTemplateUk,
  },
} as const;
