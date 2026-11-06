import { EmailTemplates } from "../types";

const getText = (customText: string) => `Bonjour {{user.name}},

${customText}

Demandé le {{ createdAt.full }}

Personnel : {{ member.name }}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}}

Client : [{{ customer.name }}]({{ adminUrl }}/dashboard/customers/{{customerId}})

Nom : {{ fields.name }}

Courriel : {{ fields.email }}

Téléphone : {{ fields.phone }}

{{#restFields}}

{{label}} ({{name}}) : {{ value }}

{{/restFields}} {{#images}}

![{{description}}]({{ websiteUrl }}/assets/{{filename}})

{{filename}}

{{/images}} 

{{#files}}
Fichier : [{{filename}}]({{ websiteUrl }}/assets/{{filename}})
{{/files}}

Service sélectionné : {{service.name}}

Modules complémentaires sélectionnés :

{{#addons}}
1. {{name}}
{{/addons}}
{{^addons}}
- Aucun
{{/addons}}

Heure : {{ dateTime.full }}

Durée : {{#duration.hours}}{{.}} heures {{/duration.hours}}{{#duration.minutes}}{{.}} min{{/duration.minutes}}

{{#discount}}
Sous-total : {{subTotalAmountFormatted}}

Remise : -{{discountAmountFormatted}} {{code}} ([{{name}}]({{ adminUrl }}/dashboard/catalog/discounts/{{id}}))

Total : {{totalPriceFormatted}}
{{/discount}}
{{^discount}}
{{#totalPrice}}
Total : {{totalPriceFormatted}}
{{/totalPrice}}
{{/discount}}

{{#totalAmountLeft}}
Paiements :

{{#payments}}
 1. {{#appName}}{{.}}{{/appName}}{{^appName}}{{#isOnline}}En ligne{{/isOnline}}{{#isGiftCard}}Carte cadeau {{#giftCardCode}}({{.}}){{/giftCardCode}}{{/isGiftCard}}{{#isCash}}Espèces{{/isCash}}{{#isInPersonCard}}Carte{{/isInPersonCard}}{{/appName}} ({{#isTips}}Pourboires{{/isTips}}{{#isOther}}Autre{{/isOther}}{{#isDeposit}}Dépôt{{/isDeposit}}{{#isRescheduleFee}}Frais de report{{/isRescheduleFee}}{{#isCancellationFee}}Frais d'annulation{{/isCancellationFee}}{{#isPayment}}Paiement{{/isPayment}}) le {{paidAt.full}} : {{amountFormatted}} {{#totalAmountRefunded}} (-{{totalAmountRefundedFormatted}} remboursé, {{amountLeftFormatted}} restant) {{/totalAmountRefunded}}
{{/payments}}
{{^payments}}
- Aucun
{{/payments}}

Montant total actuellement payé : {{totalAmountLeftFormatted}}
{{/totalAmountLeft}}

{{#totalAmountLeftToPay}}
Montant total restant à payer : {{totalAmountLeftToPayFormatted}}
{{/totalAmountLeftToPay}}`;

export const FrEmailTemplates: EmailTemplates = {
  confirmed: {
    title: "Le rendez-vous pour {{service.name}} a été confirmé.",
    text: getText("Le rendez-vous a été confirmé par vous."),
  },
  declined: {
    title: "Le rendez-vous pour {{service.name}} a été refusé.",
    text: getText("Le rendez-vous a été refusé par vous."),
  },
  cancelledByCustomer: {
    title: "Le rendez-vous pour {{service.name}} a été annulé.",
    text: getText("Le rendez-vous a été annulé par le client."),
  },
  canceled: {
    title: "Le rendez-vous pour {{service.name}} a été annulé.",
    text: getText("Le rendez-vous a été annulé par le client."),
  },
  noShow: {
    title:
      "Le rendez-vous pour {{service.name}} a été marqué comme non-présentation.",
    text: getText("Le rendez-vous a été marqué comme une non-présentation."),
  },
  rescheduledByCustomer: {
    title: "Le rendez-vous pour {{service.name}} a été reporté.",
    text: getText(
      "Le rendez-vous du {{service.name}} par {{fields.name}} a été reporté par le client{{#oldDateTime}} du {{oldDateTime.full}}{{/oldDateTime}} au {{dateTime.full}}, durée {{#duration.hours}}{{.}} heures {{/duration.hours}}{{#duration.minutes}}{{.}} min{{/duration.minutes}}",
    ),
  },
  rescheduled: {
    title: "Le rendez-vous a été reporté au {{dateTime.full}}",
    text: getText(
      "Le rendez-vous du {{service.name}} par {{fields.name}} a été reporté{{#oldDateTime}} du {{oldDateTime.full}}{{/oldDateTime}} au {{dateTime.full}}, durée {{#duration.hours}}{{.}} heures {{/duration.hours}}{{#duration.minutes}}{{.}} min{{/duration.minutes}}",
    ),
  },
  "auto-confirmed": {
    title:
      "Un rendez-vous pour {{service.name}} a été demandé et automatiquement confirmé",
    text: getText(
      "Un nouveau rendez-vous a été demandé sur le site Web et a été automatiquement confirmé.{{#packageUsage.isPackageAppointment}} Réservé avec le forfait {{packageUsage.name}} ({{packageUsage.credits}} crédits).{{/packageUsage.isPackageAppointment}}",
    ),
  },
  pending: {
    title: "Un rendez-vous pour {{service.name}} a été demandé",
    text: getText(
      "Un nouveau rendez-vous a été demandé sur le site Web pour {{service.name}}.{{#packageUsage.isPackageAppointment}} Réservé avec le forfait {{packageUsage.name}} ({{packageUsage.credits}} crédits).{{/packageUsage.isPackageAppointment}}",
    ),
  },
  subject: "{{fields.name}} pour {{service.name}} le {{dateTime.full}}",
  eventTitle: "{{fields.name}} pour {{service.name}}",
  buttonTexts: {
    viewAppointment: "Voir le rendez-vous",
    decline: "Refuser",
    confirm: "Confirmer",
  },
};
