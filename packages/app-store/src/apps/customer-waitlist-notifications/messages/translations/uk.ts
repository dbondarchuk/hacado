export const UkWaitlistSms = {
  slotOpened:
    "{{config.name}}: {{#customerName}}Привіт, {{customerName}}, з'явився{{/customerName}}{{^customerName}}З'явився{{/customerName}} час для {{waitlistEntry.service.name}} {{slotDateTime.sms}}." /* Запис: {{bookingUrl}} */,
  leaveConfirm:
    "{{config.name}}: {{#customerName}}Привіт, {{customerName}}, вас{{/customerName}}{{^customerName}}Вас{{/customerName}} знято з черги на {{waitlistEntry.service.name}}.",
};
