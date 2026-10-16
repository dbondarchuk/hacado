import { EmailTemplate } from "../types";

export const ChangeEmailTemplate: EmailTemplate["changeEmail"] = {
  subject: "Changez votre adresse e-mail",
  body: {
    previewText: "Changez votre adresse e-mail",
    content: [
      {
        type: "title",
        text: "Changez votre adresse e-mail",
      },
      {
        type: "text",
        text: `Bonjour **{{name}}**,

Vous avez demandé à changer votre adresse e-mail en **{{newEmail}}**. Veuillez cliquer sur le bouton ci-dessous pour confirmer ce changement.`,
      },
      {
        type: "button",
        button: {
          text: "Confirmer le changement d'e-mail",
          url: "{{url}}",
        },
      },
      {
        type: "text",
        text: `> **Le bouton ne fonctionne pas ?** 

> <span style="font-size: 12px;">Copiez et collez le lien ci-dessous dans votre navigateur :</span>

> <span style="font-size: 12px;">{{url}}</span>
---

#### Remarques importantes

- <span style="font-size: 12px;">Ce lien de modification d'e-mail **expire dans 24 heures**</span>
- <span style="font-size: 12px;">Si vous **n'avez pas** demandé un changement d'adresse e-mail, veuillez ignorer cet e-mail - aucune action n'est requise</span>
- <span style="font-size: 12px;">**Ne partagez jamais** ce lien avec qui que ce soit pour la sécurité de votre compte</span>
---`,
      },
    ],
  },
};
