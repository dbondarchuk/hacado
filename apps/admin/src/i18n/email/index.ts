import { Language } from "@hacado/i18n";
import { enEmailTemplates } from "./en";
import { EmailTemplate } from "./types";
import { ukEmailTemplates } from "./uk";

export const EmailTemplates: Record<Language, EmailTemplate> = {
  en: enEmailTemplates,
  uk: ukEmailTemplates,
};
