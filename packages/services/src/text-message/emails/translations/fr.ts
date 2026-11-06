import { EmailTemplates } from "../types";

const notifyReplyText = `Bonjour {{name}},

Il y a eu une réponse au message texte de {{reply.from}}.

Texte de réponse :

*{{ reply.message }}*

{{#customer}}
Client : [{{ name }}]({{ adminUrl }}/dashboard/customers/{{_id}})
{{/customer}}

{{#_id}}
Statut du rendez-vous : {{ statusText }}

Nom : {{ fields.name }}

Courriel : {{ fields.email }}

Téléphone : {{ fields.phone }}

{{#restFields}}

{{label}} ({{name}}) : {{ value }}

{{/restFields}} {{#images}}

![{{description}}]({{ websiteUrl }}/assets/{{filename}})

{{filename}}

{{/images}} {{#files}}

Fichier : [{{filename}}]({{ websiteUrl }}/assets/{{filename}})

{{/files}}

Service sélectionné : {{service.name}}

Modules complémentaires sélectionnés :

{{#addons}}
1. {{name}}
{{/addons}}
{{^addons}}
- Aucun
{{/addons}}

Heure : {{ dateTime.full}}

Durée : {{#duration.hours}}{{.}} heures {{/duration.hours}}{{#duration.minutes}}{{.}} min{{/duration.minutes}}

{{#discount}}

Code promotionnel : {{code}} (-{{discountAmountFormatted}}) ([{{name}}]({{ adminUrl }}/dashboard/catalog/discounts/{{id}}))

{{/discount}} {{#totalPriceFormatted}}

Prix : {{.}}

{{/totalPriceFormatted}} 

{{#payments}}
 1. {{#appName}}{{.}}{{/appName}}{{^appName}}{{#isOnline}}En ligne{{/isOnline}}{{#isGiftCard}}Carte cadeau {{#giftCardCode}}({{.}}){{/giftCardCode}}{{/isGiftCard}}{{#isCash}}Espèces{{/isCash}}{{#isInPersonCard}}Carte{{/isInPersonCard}}{{/appName}} ({{#isTips}}Pourboires{{/isTips}}{{#isOther}}Autre{{/isOther}}{{#isDeposit}}Dépôt{{/isDeposit}}{{#isRescheduleFee}}Frais de report{{/isRescheduleFee}}{{#isCancellationFee}}Frais d'annulation{{/isCancellationFee}}{{#isPayment}}Paiement{{/isPayment}}) le {{paidAt.full}} : {{amountFormatted}} {{#totalAmountRefunded}} (-{{totalAmountRefundedFormatted}} remboursé, {{amountLeftFormatted}} restant) {{/totalAmountRefunded}}
{{/payments}}

{{/_id}}`;

export const FrEmailTemplates: EmailTemplates = {
  "user-notify-reply": {
    title: "Réponse par SMS",
    text: notifyReplyText,
    subject:
      "Réponse par SMS de {{#customer}}{{name}}{{/customer}}{{^customer}}{{reply.from}}{{/customer}}",
  },
  buttonTexts: {
    viewAppointment: "Voir le rendez-vous",
    viewCustomer: "Voir le client",
  },
};
