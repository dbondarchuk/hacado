import { EmailTemplate } from "../types";

export const MembersReactivatedTemplate: EmailTemplate["membersReactivated"] = {
  subject: "Miembros del equipo restaurados por {{organizationName}}",
  body: {
    previewText:
      "Actualización de asiento restaurada para miembros de su equipo",
    content: [
      {
        type: "title",
        text: "Miembros del equipo restaurados",
      },
      {
        type: "text",
        text: `Hola **{{name}}**,

Tus espacios de usuario disponibles aumentaron. Los siguientes miembros fueron reactivados automáticamente:

{{memberNames}}

Te quedan **{{remainingSlots}}** asientos.`,
      },
    ],
  },
};
