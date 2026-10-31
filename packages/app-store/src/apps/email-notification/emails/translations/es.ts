import { EmailTemplates } from "../types";

const getText = (customText: string) => `Hola {{user.name}},

${customText}

Solicitado el {{ createdAt.full }}

Personal: {{ member.name }}{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}}

Cliente: [{{ customer.name }}]({{ adminUrl }}/dashboard/customers/{{customerId}})

Nombre: {{ fields.name }}

Correo electrónico: {{ fields.email }}

Teléfono: {{ fields.phone }}

{{#restFields}}

{{label}} ({{name}}): {{ value }}

{{/restFields}} {{#images}}

![{{description}}]({{ websiteUrl }}/assets/{{filename}})

{{filename}}

{{/images}} 

{{#files}}
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

Hora: {{ dateTime.full }}

Duración: {{#duration.hours}}{{.}} h {{/duration.hours}}{{#duration.minutes}}{{.}} min{{/duration.minutes}}

{{#discount}}
Subtotal: {{subTotalAmountFormatted}}

Descuento: -{{discountAmountFormatted}} {{code}} ([{{name}}]({{ adminUrl }}/dashboard/catalog/discounts/{{id}}))

Total: {{totalPriceFormatted}}
{{/discount}}
{{^discount}}
{{#totalPrice}}
Total: {{totalPriceFormatted}}
{{/totalPrice}}
{{/discount}}

{{#totalAmountLeft}}
Pagos:

{{#payments}}
 1. {{#appName}}{{.}}{{/appName}}{{^appName}}{{#isOnline}}En línea{{/isOnline}}{{#isGiftCard}}Tarjeta de regalo {{#giftCardCode}}({{.}}){{/giftCardCode}}{{/isGiftCard}}{{#isCash}}Efectivo{{/isCash}}{{#isInPersonCard}}Tarjeta{{/isInPersonCard}}{{/appName}} ({{#isTips}}Propinas{{/isTips}}{{#isOther}}Otro{{/isOther}}{{#isDeposit}}Depósito{{/isDeposit}}{{#isRescheduleFee}}Tarifa de reprogramación{{/isRescheduleFee}}{{#isCancellationFee}}Tarifa de cancelación{{/isCancellationFee}}{{#isPayment}}Pago{{/isPayment}}) en {{paidAt.full}}: {{amountFormatted}} {{#totalAmountRefunded}} (-{{totalAmountRefundedFormatted}} reembolsado, {{amountLeftFormatted}} restante) {{/totalAmountRefunded}}
{{/payments}}
{{^payments}}
- Ninguno
{{/payments}}

Monto total pagado actualmente: {{totalAmountLeftFormatted}}
{{/totalAmountLeft}}

{{#totalAmountLeftToPay}}
Monto total restante por pagar: {{totalAmountLeftToPayFormatted}}
{{/totalAmountLeftToPay}}`;

export const EsEmailTemplates: EmailTemplates = {
  confirmed: {
    title: "Se confirmó la cita para {{service.name}}.",
    text: getText("La cita fue confirmada por usted."),
  },
  declined: {
    title: "Se rechazó la cita para {{service.name}}.",
    text: getText("Usted rechazó la cita."),
  },
  cancelledByCustomer: {
    title: "La cita para {{service.name}} fue cancelada.",
    text: getText("La cita fue cancelada por el cliente."),
  },
  canceled: {
    title: "La cita para {{service.name}} fue cancelada.",
    text: getText("La cita fue cancelada por el cliente."),
  },
  noShow: {
    title: "La cita para {{service.name}} se marcó como no presentada.",
    text: getText("La cita fue marcada como una ausencia."),
  },
  rescheduledByCustomer: {
    title: "Se reprogramó la cita para {{service.name}}.",
    text: getText(
      "La cita para {{service.name}} antes de {{fields.name}} fue reprogramada por el cliente{{#oldDateTime}} de {{oldDateTime.full}}{{/oldDateTime}} a {{dateTime.full}}, duración {{#duration.hours}}{{.}} hr {{/duration.hours}}{{#duration.minutes}}{{.}} min{{/duration.minutes}}",
    ),
  },
  rescheduled: {
    title: "La cita fue reprogramada para {{dateTime.full}}",
    text: getText(
      "La cita para {{service.name}} por {{fields.name}} fue reprogramada{{#oldDateTime}} de {{oldDateTime.full}}{{/oldDateTime}} a {{dateTime.full}}, duración {{#duration.hours}}{{.}} hr {{/duration.hours}}{{#duration.minutes}}{{.}} min{{/duration.minutes}}",
    ),
  },
  "auto-confirmed": {
    title:
      "Se solicitó y confirmó automáticamente una cita para {{service.name}}",
    text: getText(
      "Se solicitó una nueva cita en el sitio web y se confirmó automáticamente.{{#packageUsage.isPackageAppointment}} Reservada con el paquete {{packageUsage.name}} ({{packageUsage.credits}} créditos).{{/packageUsage.isPackageAppointment}}",
    ),
  },
  pending: {
    title: "Se solicitó cita para {{service.name}}",
    text: getText(
      "Se solicitó una nueva cita en el sitio web para {{service.name}}.{{#packageUsage.isPackageAppointment}} Reservado con paquete {{packageUsage.name}} ({{packageUsage.credits}} créditos).{{/packageUsage.isPackageAppointment}}",
    ),
  },
  subject: "{{fields.name}} para {{service.name}} el {{dateTime.full}}",
  eventTitle: "{{fields.name}} para {{service.name}}",
  buttonTexts: {
    viewAppointment: "Ver cita",
    decline: "Rechazar",
    confirm: "Confirmar",
  },
};
