export const UkAppointmentReminderSms =
  "{{config.name}}: {{#customerName}}Привіт, {{customerName}}, це{{/customerName}}{{^customerName}}Це{{/customerName}} нагадування про {{option.name}} {{#dateTime.isTomorrow}}завтра, {{/dateTime.isTomorrow}}{{dateTime.sms}}.{{#manageLink}} Керувати: {{manageLink}}{{/manageLink}}";
