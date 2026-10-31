import { Language, resolveLanguageFromMap } from "@hacado/i18n";
import { EnWaitlistSms } from "./translations/en";
import { EsWaitlistSms } from "./translations/es";
import { FrWaitlistSms } from "./translations/fr";
import { UkWaitlistSms } from "./translations/uk";

export type WaitlistSmsBodies = {
  slotOpened: string;
  leaveConfirm: string;
};

const messages: Partial<Record<Language, WaitlistSmsBodies>> = {
  en: EnWaitlistSms,
  es: EsWaitlistSms,
  fr: FrWaitlistSms,
  uk: UkWaitlistSms,
};

export function getWaitlistSmsBodies(language: Language) {
  return resolveLanguageFromMap(messages, language) ?? messages.en!;
}
