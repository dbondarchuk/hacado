import { CustomerTextMessageBodies } from "../types";

export const EsCustomerTextMessageBodies: CustomerTextMessageBodies = {
  pending:
    "{{config.name}}: {{#customerName}}Hola {{customerName}}, recibimos{{/customerName}}{{^customerName}}Recibimos{{/customerName}} tu solicitud de {{service.name}} para {{dateTime.sms}}." /* {{#manageLink}} Gestiona: {{manageLink}}{{/manageLink}} */,
  confirmed:
    "{{config.name}}: {{#customerName}}Hola {{customerName}}, tu{{/customerName}}{{^customerName}}Tu{{/customerName}} {{service.name}} esta confirmado para {{dateTime.sms}}." /* {{#manageLink}} Gestiona: {{manageLink}}{{/manageLink}} */,
  declined:
    "{{config.name}}: {{#customerName}}Hola {{customerName}}, tu{{/customerName}}{{^customerName}}Tu{{/customerName}} cita de {{service.name}} del {{dateTime.sms}} fue rechazada. Llamanos o reserva otro horario.",
  canceled:
    "{{config.name}}: {{#customerName}}Hola {{customerName}}, tu{{/customerName}}{{^customerName}}Tu{{/customerName}} {{service.name}} del {{dateTime.sms}} fue cancelado.",
  noShow:
    "{{config.name}}: {{#customerName}}Hola {{customerName}}, te{{/customerName}}{{^customerName}}Te{{/customerName}} marcamos como ausencia en {{service.name}} del {{dateTime.sms}}.",
  rescheduled:
    "{{config.name}}: {{#customerName}}Hola {{customerName}}, tu{{/customerName}}{{^customerName}}Tu{{/customerName}} {{service.name}} se movio al {{dateTime.sms}}." /* {{#manageLink}} Gestiona: {{manageLink}}{{/manageLink}} */,
};
