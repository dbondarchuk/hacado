export const FrAppointmentReminderSms =
  "{{config.name}}: {{#customerName}}Bonjour {{customerName}}, ceci{{/customerName}}{{^customerName}}Ceci{{/customerName}} est un rappel pour {{service.name}} {{#dateTime.isTomorrow}}demain, {{/dateTime.isTomorrow}}{{^dateTime.isTomorrow}}le {{/dateTime.isTomorrow}}{{dateTime.sms}}."; /* {{#manageLink}} Gerer: {{manageLink}}{{/manageLink}} */
