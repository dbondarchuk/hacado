import { EmailTemplates } from "../types";

const getText = (customText: string) => `
Привіт {{user.name}},

${customText}

Запитаний {{ requestedAt.full }}

Персонал: {{ member.name }}

Клієнт: [{{ customer.name }}]({{ adminUrl }}/dashboard/customers/{{customerId}})

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

Обрана опція: {{ option.name }}

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
Сумарна ціна: {{subTotalAmountFormatted}}

Знижка: -{{discountAmountFormatted}} {{code}} ([{{name}}]({{ adminUrl }}/dashboard/services/discounts/{{id}}))

Загальна ціна: {{totalPriceFormatted}}
{{/discount}}
{{^discount}}
{{#totalPrice}}
Загальна ціна: {{totalPriceFormatted}}
{{/totalPrice}}
{{/discount}}

{{#totalAmountLeft}}
Платежі:

{{#payments}}
 1. {{#appName}}{{.}}{{/appName}}{{^appName}}{{#isOnline}}Онлайн{{/isOnline}}{{#isGiftCard}}Подарункова карта {{#giftCardCode}}({{.}}){{/giftCardCode}}{{/isGiftCard}}{{#isCash}}Готівка{{/isCash}}{{#isInPersonCard}}Картка{{/isInPersonCard}}{{/appName}} ({{#isTips}}Чаєві{{/isTips}}{{#isOther}}Інше{{/isOther}}{{#isDeposit}}Депозит{{/isDeposit}}{{#isRescheduleFee}}Плата за перенос{{/isRescheduleFee}}{{#isCancellationFee}}Плата за відміну{{/isCancellationFee}}{{#isPayment}}Платіж{{/isPayment}}) {{paidAt.full}}: {{amountFormatted}} {{#totalAmountRefunded}} (-{{totalAmountRefundedFormatted}} повернено, {{amountLeftFormatted}} залишилок) {{/totalAmountRefunded}}
{{/payments}}
{{^payments}}
- Жодного
{{/payments}}

Зараз сплачено: {{totalAmountLeftFormatted}}
{{/totalAmountLeft}}

{{#totalAmountLeftToPay}}
Залишок до сплати: {{totalAmountLeftToPayFormatted}}
{{/totalAmountLeftToPay}}
`;

export const UkEmailTemplates: EmailTemplates = {
  confirmed: {
    title: "Запис на {{option.name}} був підтверджений.",
    text: getText("Запис був підтверджений вами."),
  },
  declined: {
    title: "Запис на {{option.name}} був відхилений.",
    text: getText("Запис був відхилений вами."),
  },
  cancelledByCustomer: {
    title: "Запис на {{option.name}} був скасований.",
    text: getText("Запис був скасований клієнтом."),
  },
  canceled: {
    title: "Запис на {{option.name}} був скасований.",
    text: getText("Запис був скасований клієнтом."),
  },
  noShow: {
    title: "Запис на {{option.name}} позначено як неявку.",
    text: getText("Запис був позначений як неявка клієнта."),
  },
  rescheduledByCustomer: {
    title: "Запис на {{option.name}} був перенесений.",
    text: getText(
      "Запис на {{option.name}} від {{fields.name}} був перенесений клієнтом на {{dateTime.full}}, тривалість {{#duration.hours}}{{.}} год {{/duration.hours}}{{#duration.minutes}}{{.}} хв{{/duration.minutes}}",
    ),
  },
  rescheduled: {
    title: "Запис був перенесений на {{dateTime.full}}",
    text: getText(
      "Запис на {{option.name}} від {{fields.name}} був перенесений на {{dateTime.full}}, тривалість {{#duration.hours}}{{.}} год {{/duration.hours}}{{#duration.minutes}}{{.}} хв{{/duration.minutes}}",
    ),
  },
  "auto-confirmed": {
    title: "Запис на {{option.name}} був запитаний і автоматично підтверджений",
    text: getText(
      "Новий запис був запитаний на веб-сайті і автоматично підтверджений.",
    ),
  },
  pending: {
    title: "Запит на запис для {{option.name}}",
    text: getText(
      "Новий запис був запитаний на веб-сайті для {{option.name}}.",
    ),
  },
  subject: "{{fields.name}} на {{option.name}} на {{dateTime.full}}",
  eventTitle: "{{fields.name}} на {{option.name}}",
  buttonTexts: {
    viewAppointment: "Переглянути запис",
    decline: "Відхилити",
    confirm: "Підтвердити",
  },
};
