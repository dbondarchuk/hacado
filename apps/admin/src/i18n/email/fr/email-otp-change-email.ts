import { EmailTemplate } from "../types";

export const EmailOtpChangeEmailTemplate: EmailTemplate["emailOtpChangeEmail"] =
  {
    subject: "Votre code de changement d'e-mail",
    body: {
      previewText: "Votre code de changement d'e-mail",
      content: [
        {
          type: "title",
          text: "Confirmer le changement d'e-mail",
        },
        {
          type: "text",
          text: `Bonjour **{{name}}**,

Votre code de vérification du changement d'adresse e-mail est :`,
        },
        {
          type: "title",
          text: "{{otp}}",
        },
        {
          type: "text",
          text: `Ce code expire dans 5 minutes. Ne le partagez avec personne.

Si vous n'avez pas demandé de changement d'e-mail, vous pouvez ignorer cet e-mail.`,
        },
      ],
    },
  };
