import { EmailTemplates } from "../types";

const notifyReplyText = `
Hi {{name}},

There was a reply to text message message from {{reply.from}}.

Reply text:

*{{ reply.message }}*

{{#customer}}
Customer: [{{ name }}]({{ adminUrl }}/dashboard/customers/{{_id}})
{{/customer}}

{{#_id}}
Appointment status: {{ statusText }}

Name: {{ fields.name }}

Email: {{ fields.email }}

Phone: {{ fields.phone }}

{{#restFields}}

{{label}} ({{name}}): {{ value }}

{{/restFields}} {{#images}}

![{{description}}]({{ websiteUrl }}/assets/{{filename}})

{{filename}}

{{/images}} {{#files}}

File: [{{filename}}]({{ websiteUrl }}/assets/{{filename}})

{{/files}}

Service selected: {{service.name}}

Addons selected:

{{#addons}}
1. {{name}}
{{/addons}}
{{^addons}}
- None
{{/addons}}

Time: {{ dateTime.full}}

Duration: {{#duration.hours}}{{.}} hr {{/duration.hours}}{{#duration.minutes}}{{.}} min{{/duration.minutes}}

{{#discount}}

Promo code: {{code}} (-{{discountAmountFormatted}}) ([{{name}}]({{ adminUrl }}/dashboard/catalog/discounts/{{id}}))

{{/discount}} {{#totalPriceFormatted}}

Price: {{.}}

{{/totalPriceFormatted}} 

{{#payments}}
 1. {{#appName}}{{.}}{{/appName}}{{^appName}}{{#isOnline}}Online{{/isOnline}}{{#isGiftCard}}Gift card {{#giftCardCode}}({{.}}){{/giftCardCode}}{{/isGiftCard}}{{#isCash}}Cash{{/isCash}}{{#isInPersonCard}}Card{{/isInPersonCard}}{{/appName}} ({{#isTips}}Tips{{/isTips}}{{#isOther}}Other{{/isOther}}{{#isDeposit}}Deposit{{/isDeposit}}{{#isRescheduleFee}}Reschedule fee{{/isRescheduleFee}}{{#isCancellationFee}}Cancellation fee{{/isCancellationFee}}{{#isPayment}}Payment{{/isPayment}}) on {{paidAt.full}}: {{amountFormatted}} {{#totalAmountRefunded}} (-{{totalAmountRefundedFormatted}} refunded, {{amountLeftFormatted}} left) {{/totalAmountRefunded}}
{{/payments}}

{{/_id}}
`;

const notifyLowQuotaText = `
Hi {{name}},

Your TextBelt quota is low. Please add more credits.

You have {{quotaRemaining}} credits remaining.
`;

export const EnEmailTemplates: EmailTemplates = {
  "user-notify-reply": {
    title: "Text message reply",
    text: notifyReplyText,
    subject:
      "Text message reply from {{#customer}}{{name}}{{/customer}}{{^customer}}{{reply.fromNumber}}{{/customer}}",
  },
  "user-notify-low-quota": {
    title: "TextBelt low quota",
    text: notifyLowQuotaText,
    subject: "TextBelt low quota",
  },
  buttonTexts: {
    viewAppointment: "View Appointment",
    viewCustomer: "View Customer",
  },
};
