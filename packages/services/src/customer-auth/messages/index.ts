import { Language, resolveLanguageFromMap } from "@hacado/i18n";

const messages: Partial<Record<Language, string>> = {
  en: "{{config.name}}: your code is {{otp}}. It expires in 5 minutes.",
  es: "{{config.name}}: tu codigo es {{otp}}. Caduca en 5 minutos.",
  fr: "{{config.name}}: votre code est {{otp}}. Il expire dans 5 minutes.",
  uk: "{{config.name}}: ваш код {{otp}}. Діє 5 хвилин.",
};

export function getCustomerOtpSms(language: Language) {
  return resolveLanguageFromMap(messages, language) ?? messages.en!;
}
