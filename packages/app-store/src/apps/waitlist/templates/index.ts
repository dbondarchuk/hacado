import { TemplatesTemplate } from "@hacado/types/templates";
import { waitlistEntryCreatedEmailTemplate as waitlistEntryCreatedEmailTemplateEn } from "./en/waitlist-entry-created";
import { waitlistEntryCreatedEmailTemplate as waitlistEntryCreatedEmailTemplateEs } from "./es/waitlist-entry-created";
import { waitlistEntryCreatedEmailTemplate as waitlistEntryCreatedEmailTemplateFr } from "./fr/waitlist-entry-created";
import { waitlistEntryCreatedEmailTemplate as waitlistEntryCreatedEmailTemplateUk } from "./uk/waitlist-entry-created";

export const WaitlistTemplates: Record<
  string,
  Record<string, TemplatesTemplate>
> = {
  "waitlist-entry-created": {
    en: waitlistEntryCreatedEmailTemplateEn,
    fr: waitlistEntryCreatedEmailTemplateFr,
    es: waitlistEntryCreatedEmailTemplateEs,
    uk: waitlistEntryCreatedEmailTemplateUk,
  },
} as const;
