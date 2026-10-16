import { EmailTemplate } from "../types";

export const EmailOtpVerificationTemplate: EmailTemplate["emailOtpVerification"] =
  {
    subject: "Tu código de verificación",
    body: {
      previewText: "Tu código de verificación",
      content: [
        {
          type: "title",
          text: "Verifica tu correo electrónico",
        },
        {
          type: "text",
          text: `Hola **{{name}}**,

Su código de verificación es:`,
        },
        {
          type: "title",
          text: "{{otp}}",
        },
        {
          type: "text",
          text: `Este código caduca en 5 minutos. No lo compartas con nadie.

Si no creó una cuenta, puede ignorar este correo electrónico.`,
        },
      ],
    },
  };
