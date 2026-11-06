import { EmailTemplates } from "../types";

const notifyReplyText = `Hola {{name}},

Hubo una respuesta al mensaje de texto de {{reply.from}}.

Texto de respuesta:

*{{ reply.message }}*

{{#customer}}
Cliente: [{{ name }}]({{ adminUrl }}/dashboard/customers/{{_id}})
{{/customer}}

{{#_id}}
Estado de la cita: {{ statusText }}

Nombre: {{ fields.name }}

Correo electrónico: {{ fields.email }}

Teléfono: {{ fields.phone }}

{{#restFields}}

{{label}} ({{name}}): {{ value }}

{{/restFields}} {{#images}}

![{{description}}]({{ websiteUrl }}/assets/{{filename}})

{{filename}}

{{/images}} {{#files}}

Archivo: [{{filename}}]({{ websiteUrl }}/assets/{{filename}})

{{/files}}

Servicio seleccionado: {{service.name}}

Complementos seleccionados:

{{#addons}}
1. {{name}}
{{/addons}}
{{^addons}}
- Ninguno
{{/addons}}

Hora: {{ dateTime.full}}

Duración: {{#duration.hours}}{{.}} h {{/duration.hours}}{{#duration.minutes}}{{.}} min{{/duration.minutes}}

{{#discount}}

Código de promoción: {{code}} (-{{discountAmountFormatted}}) ([{{name}}]({{ adminUrl }}/dashboard/catalog/discounts/{{id}}))

{{/discount}} {{#totalPriceFormatted}}

Precio: {{.}}

{{/totalPriceFormatted}} 

{{#payments}}
 1. {{#appName}}{{.}}{{/appName}}{{^appName}}{{#isOnline}}En línea{{/isOnline}}{{#isGiftCard}}Tarjeta de regalo {{#giftCardCode}}({{.}}){{/giftCardCode}}{{/isGiftCard}}{{#isCash}}Efectivo{{/isCash}}{{#isInPersonCard}}Tarjeta{{/isInPersonCard}}{{/appName}} ({{#isTips}}Propinas{{/isTips}}{{#isOther}}Otro{{/isOther}}{{#isDeposit}}Depósito{{/isDeposit}}{{#isRescheduleFee}}Tarifa de reprogramación{{/isRescheduleFee}}{{#isCancellationFee}}Tarifa de cancelación{{/isCancellationFee}}{{#isPayment}}Pago{{/isPayment}}) en {{paidAt.full}}: {{amountFormatted}} {{#totalAmountRefunded}} (-{{totalAmountRefundedFormatted}} reembolsado, {{amountLeftFormatted}} restante) {{/totalAmountRefunded}}
{{/payments}}

{{/_id}}`;

export const EsEmailTemplates: EmailTemplates = {
  "user-notify-reply": {
    title: "Respuesta de mensaje de texto",
    text: notifyReplyText,
    subject:
      "Respuesta de mensaje de texto de {{#customer}}{{name}}{{/customer}}{{^customer}}{{reply.from}}{{/customer}}",
  },
  buttonTexts: {
    viewAppointment: "Ver cita",
    viewCustomer: "Ver cliente",
  },
};
