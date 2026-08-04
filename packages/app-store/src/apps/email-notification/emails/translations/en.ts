import { EmailTemplates } from "../types";

const getText = (customText: string) => `
Hi {{user.name}},

${customText}

Requested on {{ createdAt.full }}

Staff: {{ member.name }}

Customer: [{{ customer.name }}]({{ adminUrl }}/dashboard/customers/{{customerId}})

Name: {{ fields.name }}

Email: {{ fields.email }}

Phone: {{ fields.phone }}

{{#restFields}}

{{label}} ({{name}}): {{ value }}

{{/restFields}} {{#images}}

![{{description}}]({{ websiteUrl }}/assets/{{filename}})

{{filename}}

{{/images}} 

{{#files}}
File: [{{filename}}]({{ websiteUrl }}/assets/{{filename}})
{{/files}}

Option selected: {{ option.name }}

Addons selected:

{{#addons}}
1. {{name}}
{{/addons}}
{{^addons}}
- None
{{/addons}}

Time: {{ dateTime.full }}

Duration: {{#duration.hours}}{{.}} hr {{/duration.hours}}{{#duration.minutes}}{{.}} min{{/duration.minutes}}

{{#discount}}
Subtotal: {{subTotalAmountFormatted}}

Discount: -{{discountAmountFormatted}} {{code}} ([{{name}}]({{ adminUrl }}/dashboard/services/discounts/{{id}}))

Total: {{totalPriceFormatted}}
{{/discount}}
{{^discount}}
{{#totalPrice}}
Total: {{totalPriceFormatted}}
{{/totalPrice}}
{{/discount}}

{{#totalAmountLeft}}
Payments:

{{#payments}}
 1. {{#appName}}{{.}}{{/appName}}{{^appName}}{{#isOnline}}Online{{/isOnline}}{{#isGiftCard}}Gift card {{#giftCardCode}}({{.}}){{/giftCardCode}}{{/isGiftCard}}{{#isCash}}Cash{{/isCash}}{{#isInPersonCard}}Card{{/isInPersonCard}}{{/appName}} ({{#isTips}}Tips{{/isTips}}{{#isOther}}Other{{/isOther}}{{#isDeposit}}Deposit{{/isDeposit}}{{#isRescheduleFee}}Reschedule fee{{/isRescheduleFee}}{{#isCancellationFee}}Cancellation fee{{/isCancellationFee}}{{#isPayment}}Payment{{/isPayment}}) on {{paidAt.full}}: {{amountFormatted}} {{#totalAmountRefunded}} (-{{totalAmountRefundedFormatted}} refunded, {{amountLeftFormatted}} left) {{/totalAmountRefunded}}
{{/payments}}
{{^payments}}
- None
{{/payments}}

Total amount currently paid: {{totalAmountLeftFormatted}}
{{/totalAmountLeft}}

{{#totalAmountLeftToPay}}
Total amount left to pay: {{totalAmountLeftToPayFormatted}}
{{/totalAmountLeftToPay}}
`;

export const EnEmailTemplates: EmailTemplates = {
  confirmed: {
    title: "Appointment for {{option.name}} was confirmed.",
    text: getText("The appointment was confirmed by you."),
  },
  declined: {
    title: "Appointment for {{option.name}} was declined.",
    text: getText("The appointment was declined by you."),
  },
  cancelledByCustomer: {
    title: "Appointment for {{option.name}} was cancelled.",
    text: getText("The appointment was cancelled by the customer."),
  },
  rescheduledByCustomer: {
    title: "Appointment for {{option.name}} was rescheduled.",
    text: getText(
      "The appointment for {{option.name}} by {{fields.name}} was rescheduled by the customer for {{dateTime.full}}, duration {{#duration.hours}}{{.}} hr {{/duration.hours}}{{#duration.minutes}}{{.}} min{{/duration.minutes}}",
    ),
  },
  rescheduled: {
    title: "Appointment was rescheduled for {{dateTime.full}}",
    text: getText(
      "The appointment for {{option.name}} by {{fields.name}} was rescheduled for {{dateTime.full}}, duration {{#duration.hours}}{{.}} hr {{/duration.hours}}{{#duration.minutes}}{{.}} min{{/duration.minutes}}",
    ),
  },
  "auto-confirmed": {
    title: "Appointment for {{option.name}} was requested and auto-confirmed",
    text: getText(
      "A new appointment was requested on the website and was auto-confirmed.",
    ),
  },
  pending: {
    title: "Appointment for {{option.name}} was requested",
    text: getText(
      "A new appointment was requested on the website for {{option.name}}.",
    ),
  },
  subject: "{{fields.name}} for {{option.name}} on {{dateTime.full}}",
  eventTitle: "{{fields.name}} for {{option.name}}",
  buttonTexts: {
    viewAppointment: "View Appointment",
    decline: "Decline",
    confirm: "Confirm",
  },
};
