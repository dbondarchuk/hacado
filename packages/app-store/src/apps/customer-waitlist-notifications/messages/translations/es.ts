export const EsWaitlistSms = {
  slotOpened:
    "{{config.name}}: {{#customerName}}Hola {{customerName}}, hay{{/customerName}}{{^customerName}}Hay{{/customerName}} un hueco para {{waitlistEntry.option.name}} el {{slotDateTime.sms}}. Reserva: {{bookingUrl}}",
  leaveConfirm:
    "{{config.name}}: {{#customerName}}Hola {{customerName}}, te{{/customerName}}{{^customerName}}Te{{/customerName}} quitamos de la lista de espera de {{waitlistEntry.option.name}}.",
};
