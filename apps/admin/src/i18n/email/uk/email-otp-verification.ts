import { EmailTemplate } from "../types";

export const EmailOtpVerificationTemplate: EmailTemplate["emailOtpVerification"] =
  {
    subject: "Ваш код підтвердження",
    body: {
      previewText: "Ваш код підтвердження",
      content: [
        {
          type: "title",
          text: "Підтвердіть email",
        },
        {
          type: "text",
          text: `Привіт **{{name}}**,

Ваш код підтвердження:`,
        },
        {
          type: "title",
          text: "{{otp}}",
        },
        {
          type: "text",
          text: `Код дійсний 5 хвилин. Нікому його не повідомляйте.

Якщо ви не створювали обліковий запис, просто проігноруйте цей лист.`,
        },
      ],
    },
  };
