export const EnAppointmentReminderSms =
  "{{config.name}}: {{#customerName}}Hi {{customerName}}, this{{/customerName}}{{^customerName}}This{{/customerName}} is a reminder for {{service.name}} {{#dateTime.isTomorrow}}tomorrow, {{/dateTime.isTomorrow}}{{^dateTime.isTomorrow}}on {{/dateTime.isTomorrow}}{{dateTime.sms}}.{{#manageLink}} Manage: {{manageLink}}{{/manageLink}}";
