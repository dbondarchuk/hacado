import { EmailTemplate } from "../types";

export const EmailOtpPasswordResetTemplate: EmailTemplate["emailOtpPasswordReset"] =
  {
    subject: "Su código de restablecimiento de contraseña",
    body: {
      previewText: "Su código de restablecimiento de contraseña",
      content: [
        {
          type: "title",
          text: "Restablece tu contraseña",
        },
        {
          type: "text",
          text: `Hola **{{name}}**,

Su código de restablecimiento de contraseña es:`,
        },
        {
          type: "title",
          text: "{{otp}}",
        },
        {
          type: "text",
          text: `Este código caduca en 5 minutos. No lo compartas con nadie.

Si no solicitó un restablecimiento de contraseña, puede ignorar este correo electrónico.`,
        },
      ],
    },
  };
