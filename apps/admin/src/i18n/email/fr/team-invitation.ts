import { EmailTemplate } from "../types";

export const TeamInvitationTemplate: EmailTemplate["teamInvitation"] = {
  subject: "Vous avez été invité à rejoindre {{organizationName}}",
  body: {
    previewText: "Rejoignez {{organizationName}} sur Hacado",
    content: [
      {
        type: "title",
        text: "Invitation d'équipe",
      },
      {
        type: "text",
        text: `Salut,

**{{inviterName}}** vous a invité à rejoindre **{{organizationName}}**.

Cliquez sur le bouton ci-dessous pour accepter l'invitation.`,
      },
      {
        type: "button",
        button: {
          text: "Accepter l'invitation",
          url: "{{url}}",
        },
      },
      {
        type: "text",
        text: `> **Le bouton ne fonctionne pas ?**

> <span style="font-size: 12px;">Copiez et collez le lien ci-dessous dans votre navigateur :</span>

> <span style="font-size: 12px;">{{url}}</span>
---

<span style="font-size: 12px;">Cette invitation expire dans 2 jours. Si vous ne vous attendiez pas à cet e-mail, vous pouvez l'ignorer.</span>`,
      },
    ],
  },
};
