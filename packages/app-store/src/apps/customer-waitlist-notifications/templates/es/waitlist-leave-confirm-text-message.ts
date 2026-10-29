import { TemplatesTemplate } from "@hacado/types";

export const waitlistLeaveConfirmTextMessageTemplate: TemplatesTemplate = {
  name: "Mensaje de texto de confirmación de salida de lista de espera",
  type: "text-message",
  value:
    "Hola {{waitlistEntry.name}}, has sido eliminado de la lista de espera para {{waitlistEntry.service.name}} a las {{config.name}}.",
};
