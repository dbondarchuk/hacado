import { EmailTemplate } from "../types";

export const MembersReactivatedTemplate: EmailTemplate["membersReactivated"] = {
  subject: "Membres de l'équipe restaurés pour {{organizationName}}",
  body: {
    previewText:
      "Le surclassement de siège a restauré les membres de votre équipe",
    content: [
      {
        type: "title",
        text: "Membres de l'équipe restaurés",
      },
      {
        type: "text",
        text: `Bonjour **{{name}}**,

Vos emplacements utilisateur disponibles ont augmenté. Les membres suivants ont été automatiquement réactivés :

{{memberNames}}

Il vous reste **{{remainingSlots}}** siège(s) restant.`,
      },
    ],
  },
};
