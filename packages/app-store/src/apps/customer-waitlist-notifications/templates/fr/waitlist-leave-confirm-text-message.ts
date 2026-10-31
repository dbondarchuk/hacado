import { TemplatesTemplate } from "@hacado/types/templates";

export const waitlistLeaveConfirmTextMessageTemplate: TemplatesTemplate = {
  name: "Message texte de confirmation de départ sur liste d'attente",
  type: "text-message",
  value:
    "Bonjour {{waitlistEntry.name}}, vous avez été supprimé de la liste d'attente pour {{waitlistEntry.service.name}} à {{config.name}}.",
};
