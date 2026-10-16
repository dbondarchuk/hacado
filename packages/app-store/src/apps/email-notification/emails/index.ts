import { Language } from "@hacado/i18n";
import { EnEmailTemplates } from "./translations/en";
import { EsEmailTemplates } from "./translations/es";
import { FrEmailTemplates } from "./translations/fr";
import { UkEmailTemplates } from "./translations/uk";
import { EmailTemplates } from "./types";

export const UserEmailTemplates: Partial<Record<Language, EmailTemplates>> = {
  en: EnEmailTemplates,
  fr: FrEmailTemplates,
  es: EsEmailTemplates,
  uk: UkEmailTemplates,
};
