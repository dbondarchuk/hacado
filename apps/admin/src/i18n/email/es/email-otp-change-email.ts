import { EmailTemplate } from "../types";

export const EmailOtpChangeEmailTemplate: EmailTemplate["emailOtpChangeEmail"] =
  {
    subject: "Tu código de cambio de correo electrónico",
    body: {
      previewText: "Tu código de cambio de correo electrónico",
      content: [
        {
          type: "title",
          text: "Confirmar cambio de correo electrónico",
        },
        {
          type: "text",
          text: `Hola **{{name}}**,

Su código de verificación de cambio de correo electrónico es:`,
        },
        {
          type: "title",
          text: "{{otp}}",
        },
        {
          type: "text",
          text: `Este código caduca en 5 minutos. No lo compartas con nadie.

Si no solicitó un cambio de correo electrónico, puede ignorar este correo electrónico.`,
        },
      ],
    },
  };
