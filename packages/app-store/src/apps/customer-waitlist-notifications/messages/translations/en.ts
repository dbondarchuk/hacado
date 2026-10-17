export const EnWaitlistSms = {
  slotOpened:
    "{{config.name}}: {{#customerName}}Hi {{customerName}}, there{{/customerName}}{{^customerName}}There{{/customerName}} is an opening for {{waitlistEntry.option.name}} on {{slotDateTime.sms}}. Book: {{bookingUrl}}",
  leaveConfirm:
    "{{config.name}}: {{#customerName}}Hi {{customerName}}, you{{/customerName}}{{^customerName}}You{{/customerName}} were removed from the waitlist for {{waitlistEntry.option.name}}.",
};
