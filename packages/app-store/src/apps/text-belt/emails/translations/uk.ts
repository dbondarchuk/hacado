import { EmailTemplates } from "../types";

const notifyReplyText = `
Привіт {{name}},

Була отримана відповідь на текстове повідомлення від {{reply.from}}.

Текст відповіді:

*{{ reply.message }}*

{{#customer}}
Клієнт: [{{ name }}]({{ adminUrl }}/dashboard/customers/{{_id}})
{{/customer}}

{{#_id}}
Статус запису: {{ statusText }}

Ім'я: {{ fields.name }}

Email: {{ fields.email }}

Телефон: {{ fields.phone }}

{{#restFields}}

{{label}} ({{name}}): {{ value }}

{{/restFields}} {{#images}}

![{{description}}]({{ websiteUrl }}/assets/{{filename}})

{{filename}}

{{/images}} {{#files}}

Файл: [{{filename}}]({{ websiteUrl }}/assets/{{filename}})

{{/files}}

Обрана послуга: {{service.name}}

Обрані додатки:

{{#addons}}
1. {{name}}
{{/addons}}
{{^addons}}
- Жодного
{{/addons}}

Час: {{ dateTime.full}}

Тривалість: {{#duration.hours}}{{.}} год {{/duration.hours}}{{#duration.minutes}}{{.}} хв{{/duration.minutes}}

{{#discount}}

Промокод: {{code}} (-{{discountAmountFormatted}}) ([{{name}}]({{ adminUrl }}/dashboard/catalog/discounts/{{id}}))

{{/discount}} {{#totalPriceFormatted}}

Ціна: {{.}}

{{/totalPriceFormatted}} 

{{#payments}}
 1. {{#appName}}{{.}}{{/appName}}{{^appName}}{{#isOnline}}Онлайн{{/isOnline}}{{#isGiftCard}}Подарункова карта {{#giftCardCode}}({{.}}){{/giftCardCode}}{{/isGiftCard}}{{#isCash}}Готівка{{/isCash}}{{#isInPersonCard}}Картка{{/isInPersonCard}}{{/appName}} ({{#isTips}}Чаєві{{/isTips}}{{#isOther}}Інше{{/isOther}}{{#isDeposit}}Депозит{{/isDeposit}}{{#isRescheduleFee}}Плата за перенос{{/isRescheduleFee}}{{#isCancellationFee}}Плата за відміну{{/isCancellationFee}}{{#isPayment}}Платіж{{/isPayment}}) {{paidAt.full}}: {{amountFormatted}} {{#totalAmountRefunded}} (-{{totalAmountRefundedFormatted}} повернено, {{amountLeftFormatted}} залишилок) {{/totalAmountRefunded}}
{{/payments}}

{{/_id}}
`;

const notifyLowQuotaText = `
Привіт {{name}},

Ваш ліміт TextBelt майже вичерпаний. Будь ласка, поповніть кредити.

У вас залишилося {{quotaRemaining}} кредитів.
`;

export const UkEmailTemplates: EmailTemplates = {
  "user-notify-reply": {
    title: "Відповідь на текстове повідомлення",
    text: notifyReplyText,
    subject:
      "Відповідь на текстове повідомлення від {{#customer}}{{name}}{{/customer}}{{^customer}}{{reply.fromNumber}}{{/customer}}",
  },
  "user-notify-low-quota": {
    title: "Низький ліміт TextBelt",
    text: notifyLowQuotaText,
    subject: "Низький ліміт TextBelt",
  },
  buttonTexts: {
    viewAppointment: "Переглянути запис",
    viewCustomer: "Переглянути клієнта",
  },
};
