import { CustomerTextMessageBodies } from "../types";

export const EnCustomerTextMessageBodies: CustomerTextMessageBodies = {
  pending:
    "{{config.name}}: {{#customerName}}Hi {{customerName}}, we{{/customerName}}{{^customerName}}We{{/customerName}} received your {{option.name}} request for {{dateTime.sms}}.{{#manageLink}} Manage: {{manageLink}}{{/manageLink}}",
  confirmed:
    "{{config.name}}: {{#customerName}}Hi {{customerName}}, your{{/customerName}}{{^customerName}}Your{{/customerName}} {{option.name}} is confirmed for {{dateTime.sms}}.{{#manageLink}} Manage: {{manageLink}}{{/manageLink}}",
  declined:
    "{{config.name}}: {{#customerName}}Hi {{customerName}}, your{{/customerName}}{{^customerName}}Your{{/customerName}} appointment for {{option.name}} scheduled for {{dateTime.sms}} was declined. Please call us or book another time.",
  canceled:
    "{{config.name}}: {{#customerName}}Hi {{customerName}}, your{{/customerName}}{{^customerName}}Your{{/customerName}} {{option.name}} on {{dateTime.sms}} was canceled.",
  noShow:
    "{{config.name}}: {{#customerName}}Hi {{customerName}}, you{{/customerName}}{{^customerName}}You{{/customerName}} were marked as a no-show for {{option.name}} on {{dateTime.sms}}.",
  rescheduled:
    "{{config.name}}: {{#customerName}}Hi {{customerName}}, your{{/customerName}}{{^customerName}}Your{{/customerName}} {{option.name}} was moved to {{dateTime.sms}}.{{#manageLink}} Manage: {{manageLink}}{{/manageLink}}",
};
