import { TemplatesTemplate } from "@hacado/types";
import { waitlistEntryCreatedEmailTemplate as waitlistEntryCreatedEmailTemplateEn } from "./en/waitlist-entry-created";
import { waitlistEntryCreatedEmailTemplate as waitlistEntryCreatedEmailTemplateUk } from "./uk/waitlist-entry-created";

export const WaitlistTemplates: Record<
  string,
  Record<string, TemplatesTemplate>
> = {
  "waitlist-entry-created": {
    en: waitlistEntryCreatedEmailTemplateEn,
    uk: waitlistEntryCreatedEmailTemplateUk,
  },
} as const;
