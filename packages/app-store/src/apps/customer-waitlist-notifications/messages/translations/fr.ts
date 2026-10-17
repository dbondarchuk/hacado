export const FrWaitlistSms = {
  slotOpened:
    "{{config.name}}: {{#customerName}}Bonjour {{customerName}}, un creneau est libre{{/customerName}}{{^customerName}}Un creneau est libre{{/customerName}} pour {{waitlistEntry.option.name}} le {{slotDateTime.sms}}. Reserver: {{bookingUrl}}",
  leaveConfirm:
    "{{config.name}}: {{#customerName}}Bonjour {{customerName}}, vous avez{{/customerName}}{{^customerName}}Vous avez{{/customerName}} ete retire de la liste d'attente pour {{waitlistEntry.option.name}}.",
};
