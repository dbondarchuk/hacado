import { Language } from "@hacado/i18n";
import { EnEmailTemplates } from "./translations/en";
import { UkEmailTemplates } from "./translations/uk";
import { EmailTemplates } from "./types";

export const UserEmailTemplates: Record<Language, EmailTemplates> = {
  en: EnEmailTemplates,
  uk: UkEmailTemplates,
};
