import { EmailTemplate } from "../types";

export const EmailOtpPasswordResetTemplate: EmailTemplate["emailOtpPasswordReset"] =
  {
    subject: "Votre code de réinitialisation de mot de passe",
    body: {
      previewText: "Votre code de réinitialisation de mot de passe",
      content: [
        {
          type: "title",
          text: "Réinitialisez votre mot de passe",
        },
        {
          type: "text",
          text: `Bonjour **{{name}}**,

Votre code de réinitialisation de mot de passe est :`,
        },
        {
          type: "title",
          text: "{{otp}}",
        },
        {
          type: "text",
          text: `Ce code expire dans 5 minutes. Ne le partagez avec personne.

Si vous n'avez pas demandé de réinitialisation de mot de passe, vous pouvez ignorer cet e-mail.`,
        },
      ],
    },
  };
