import { EmailTemplate } from "../types";

export const EmailVerificationTemplate: EmailTemplate["emailVerification"] = {
  subject: "Vérifiez votre adresse e-mail",
  body: {
    previewText: "Vérifiez votre adresse e-mail",
    content: [
      {
        type: "title",
        text: "Vérifiez votre adresse e-mail",
      },
      {
        type: "text",
        text: `Bonjour **{{name}}**,

Veuillez vérifier votre adresse e-mail en cliquant sur le bouton ci-dessous. Cela nous aide à confirmer que vous possédez cet e-mail et à sécuriser votre compte.`,
      },
      {
        type: "button",
        button: {
          text: "Vérifier mon adresse e-mail",
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

- <span style="font-size: 12px;">Ce lien de vérification **expire dans 24 heures**</span>
- <span style="font-size: 12px;">Si vous **n'avez pas** créé de compte, veuillez ignorer cet e-mail - aucune action n'est requise</span>
- <span style="font-size: 12px;">**Ne partagez jamais** ce lien avec qui que ce soit pour la sécurité de votre compte</span>
---`,
      },
    ],
  },
};
