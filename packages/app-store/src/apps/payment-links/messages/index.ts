import { Language, resolveLanguageFromMap } from "@hacado/i18n";

const messages: Partial<Record<Language, string>> = {
  en: "{{config.name}}: {{#customerName}}Hi {{customerName}}, here{{/customerName}}{{^customerName}}Here{{/customerName}} is your payment link." /* {{paymentLinkUrl}} */,
  es: "{{config.name}}: {{#customerName}}Hola {{customerName}}, aqui{{/customerName}}{{^customerName}}Aqui{{/customerName}} esta tu enlace de pago." /* {{paymentLinkUrl}} */,
  fr: "{{config.name}}: {{#customerName}}Bonjour {{customerName}}, voici{{/customerName}}{{^customerName}}Voici{{/customerName}} votre lien de paiement." /* {{paymentLinkUrl}} */,
  uk: "{{config.name}}: {{#customerName}}Привіт, {{customerName}}, ось{{/customerName}}{{^customerName}}Ось{{/customerName}} ваше посилання на оплату." /* {{paymentLinkUrl}} */,
};

export function getPaymentLinkSms(language: Language) {
  return resolveLanguageFromMap(messages, language) ?? messages.en!;
}
