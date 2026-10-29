export const EsAppointmentReminderSms =
  "{{config.name}}: {{#customerName}}Hola {{customerName}}, este{{/customerName}}{{^customerName}}Este{{/customerName}} es un recordatorio de {{service.name}} {{#dateTime.isTomorrow}}manana, {{/dateTime.isTomorrow}}{{^dateTime.isTomorrow}}el {{/dateTime.isTomorrow}}{{dateTime.sms}}.{{#manageLink}} Gestiona: {{manageLink}}{{/manageLink}}";
