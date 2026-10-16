import { EmailTemplate } from "../types";

export const EmailOtpVerificationTemplate: EmailTemplate["emailOtpVerification"] =
  {
    subject: "Votre code de vérification",
    body: {
      previewText: "Votre code de vérification",
      content: [
        {
          type: "title",
          text: "Vérifiez votre email",
        },
        {
          type: "text",
          text: `Bonjour **{{name}}**,

Votre code de vérification est :`,
        },
        {
          type: "title",
          text: "{{otp}}",
        },
        {
          type: "text",
          text: `Ce code expire dans 5 minutes. Ne le partagez avec personne.

Si vous n'avez pas créé de compte, vous pouvez ignorer cet e-mail.`,
        },
      ],
    },
  };
