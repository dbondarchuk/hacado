import { CustomerTextMessageBodies } from "../types";

export const FrCustomerTextMessageBodies: CustomerTextMessageBodies = {
  pending:
    "{{config.name}}: {{#customerName}}Bonjour {{customerName}}, nous avons{{/customerName}}{{^customerName}}Nous avons{{/customerName}} recu votre demande {{option.name}} pour {{dateTime.sms}}.{{#manageLink}} Gerer: {{manageLink}}{{/manageLink}}",
  confirmed:
    "{{config.name}}: {{#customerName}}Bonjour {{customerName}}, votre{{/customerName}}{{^customerName}}Votre{{/customerName}} {{option.name}} est confirme pour {{dateTime.sms}}.{{#manageLink}} Gerer: {{manageLink}}{{/manageLink}}",
  declined:
    "{{config.name}}: {{#customerName}}Bonjour {{customerName}}, votre{{/customerName}}{{^customerName}}Votre{{/customerName}} rendez-vous {{option.name}} du {{dateTime.sms}} a ete refuse. Appelez-nous ou reservez un autre creneau.",
  canceled:
    "{{config.name}}: {{#customerName}}Bonjour {{customerName}}, votre{{/customerName}}{{^customerName}}Votre{{/customerName}} {{option.name}} du {{dateTime.sms}} a ete annule.",
  noShow:
    "{{config.name}}: {{#customerName}}Bonjour {{customerName}}, vous avez{{/customerName}}{{^customerName}}Vous avez{{/customerName}} ete note absent pour {{option.name}} le {{dateTime.sms}}.",
  rescheduled:
    "{{config.name}}: {{#customerName}}Bonjour {{customerName}}, votre{{/customerName}}{{^customerName}}Votre{{/customerName}} {{option.name}} a ete deplace au {{dateTime.sms}}.{{#manageLink}} Gerer: {{manageLink}}{{/manageLink}}",
};
