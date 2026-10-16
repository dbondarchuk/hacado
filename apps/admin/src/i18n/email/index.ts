import { Language } from "@hacado/i18n";
import { enEmailTemplates } from "./en";
import { esEmailTemplates } from "./es";
import { frEmailTemplates } from "./fr";
import { EmailTemplate } from "./types";
import { ukEmailTemplates } from "./uk";

export const EmailTemplates: Partial<Record<Language, EmailTemplate>> = {
  en: enEmailTemplates,
  fr: frEmailTemplates,
  es: esEmailTemplates,
  uk: ukEmailTemplates,
};
