import { TemplateTemplatesList } from "@hacado/types/templates";
import { waitlistEntryCreatedEmailTemplate as waitlistEntryCreatedEmailTemplateEn } from "../../waitlist/templates/en/waitlist-entry-created";
import { waitlistEntryCreatedEmailTemplate as waitlistEntryCreatedEmailTemplateEs } from "../../waitlist/templates/es/waitlist-entry-created";
import { waitlistEntryCreatedEmailTemplate as waitlistEntryCreatedEmailTemplateFr } from "../../waitlist/templates/fr/waitlist-entry-created";
import { waitlistEntryCreatedEmailTemplate as waitlistEntryCreatedEmailTemplateUk } from "../../waitlist/templates/uk/waitlist-entry-created";
import { waitlistLeaveConfirmTextMessageTemplate as waitlistLeaveConfirmTextMessageTemplateEn } from "./en/waitlist-leave-confirm-text-message";
import { waitlistSlotOpenedEmailTemplate as waitlistSlotOpenedEmailTemplateEn } from "./en/waitlist-slot-opened-email";
import { waitlistSlotOpenedTextMessageTemplate as waitlistSlotOpenedTextMessageTemplateEn } from "./en/waitlist-slot-opened-text-message";
import { waitlistLeaveConfirmTextMessageTemplate as waitlistLeaveConfirmTextMessageTemplateEs } from "./es/waitlist-leave-confirm-text-message";
import { waitlistSlotOpenedEmailTemplate as waitlistSlotOpenedEmailTemplateEs } from "./es/waitlist-slot-opened-email";
import { waitlistSlotOpenedTextMessageTemplate as waitlistSlotOpenedTextMessageTemplateEs } from "./es/waitlist-slot-opened-text-message";
import { waitlistLeaveConfirmTextMessageTemplate as waitlistLeaveConfirmTextMessageTemplateFr } from "./fr/waitlist-leave-confirm-text-message";
import { waitlistSlotOpenedEmailTemplate as waitlistSlotOpenedEmailTemplateFr } from "./fr/waitlist-slot-opened-email";
import { waitlistSlotOpenedTextMessageTemplate as waitlistSlotOpenedTextMessageTemplateFr } from "./fr/waitlist-slot-opened-text-message";
import { waitlistLeaveConfirmTextMessageTemplate as waitlistLeaveConfirmTextMessageTemplateUk } from "./uk/waitlist-leave-confirm-text-message";
import { waitlistSlotOpenedEmailTemplate as waitlistSlotOpenedEmailTemplateUk } from "./uk/waitlist-slot-opened-email";
import { waitlistSlotOpenedTextMessageTemplate as waitlistSlotOpenedTextMessageTemplateUk } from "./uk/waitlist-slot-opened-text-message";

export const CustomerWaitlistNotificationsTemplates: TemplateTemplatesList = {
  "waitlist-entry-created-email": {
    en: waitlistEntryCreatedEmailTemplateEn,
    fr: waitlistEntryCreatedEmailTemplateFr,
    es: waitlistEntryCreatedEmailTemplateEs,
    uk: waitlistEntryCreatedEmailTemplateUk,
  },
  "waitlist-slot-opened-email": {
    en: waitlistSlotOpenedEmailTemplateEn,
    fr: waitlistSlotOpenedEmailTemplateFr,
    es: waitlistSlotOpenedEmailTemplateEs,
    uk: waitlistSlotOpenedEmailTemplateUk,
  },
  "waitlist-slot-opened-text-message": {
    en: waitlistSlotOpenedTextMessageTemplateEn,
    fr: waitlistSlotOpenedTextMessageTemplateFr,
    es: waitlistSlotOpenedTextMessageTemplateEs,
    uk: waitlistSlotOpenedTextMessageTemplateUk,
  },
  "waitlist-leave-confirm-text-message": {
    en: waitlistLeaveConfirmTextMessageTemplateEn,
    fr: waitlistLeaveConfirmTextMessageTemplateFr,
    es: waitlistLeaveConfirmTextMessageTemplateEs,
    uk: waitlistLeaveConfirmTextMessageTemplateUk,
  },
} as const;
