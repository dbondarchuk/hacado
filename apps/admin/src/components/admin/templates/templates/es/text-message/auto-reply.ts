import { TemplatesTemplate } from "@hacado/types/templates";

export const autoReplyTextMessageTemplate: TemplatesTemplate = {
  name: "Respuesta automática de mensajes de texto",
  type: "text-message",
  value:
    "Hola{{#customer.name}} {{.}}{{/customer.name}},\nEste es un número de teléfono no monitoreado. Envíe su respuesta a {{config.phone}}.\n\nGracias,\n{{config.name}}",
};
