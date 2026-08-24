import { EmailTemplate } from "../types";

export const EmailOtpPasswordResetTemplate: EmailTemplate["emailOtpPasswordReset"] =
  {
    subject: "Ваш код скидання пароля",
    body: {
      previewText: "Ваш код скидання пароля",
      content: [
        {
          type: "title",
          text: "Скидання пароля",
        },
        {
          type: "text",
          text: `Привіт **{{name}}**,

Ваш код скидання пароля:`,
        },
        {
          type: "title",
          text: "{{otp}}",
        },
        {
          type: "text",
          text: `Код дійсний 5 хвилин. Нікому його не повідомляйте.

Якщо ви не запитували скидання пароля, просто проігноруйте цей лист.`,
        },
      ],
    },
  };
