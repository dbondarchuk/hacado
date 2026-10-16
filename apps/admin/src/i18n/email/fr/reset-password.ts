import { EmailTemplate } from "../types";

export const ResetPasswordTemplate: EmailTemplate["resetPassword"] = {
  subject: "Réinitialisez votre mot de passe",
  body: {
    previewText: "Réinitialisez votre mot de passe",
    content: [
      {
        type: "title",
        text: "Réinitialisez votre mot de passe",
      },
      {
        type: "text",
        text: `Bonjour **{{name}}**,

Veuillez réinitialiser votre mot de passe en cliquant sur le bouton ci-dessous. Cela nous aide à confirmer que vous possédez cet e-mail et à sécuriser votre compte.`,
      },
      {
        type: "button",
        button: {
          text: "Réinitialiser mon mot de passe",
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

- <span style="font-size: 12px;">Ce lien de réinitialisation du mot de passe **expire dans 24 heures**</span>
- <span style="font-size: 12px;">Si vous **n'avez pas** demandé une réinitialisation de mot de passe, veuillez ignorer cet e-mail - aucune action n'est requise</span>
- <span style="font-size: 12px;">**Ne partagez jamais** ce lien avec qui que ce soit pour la sécurité de votre compte</span>
---`,
      },
    ],
  },
};
