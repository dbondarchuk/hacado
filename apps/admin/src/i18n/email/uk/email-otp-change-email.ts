import { EmailTemplate } from "../types";

export const EmailOtpChangeEmailTemplate: EmailTemplate["emailOtpChangeEmail"] =
  {
    subject: "Ваш код зміни email",
    body: {
      previewText: "Ваш код зміни email",
      content: [
        {
          type: "title",
          text: "Підтвердження зміни email",
        },
        {
          type: "text",
          text: `Привіт **{{name}}**,

Ваш код підтвердження зміни email:`,
        },
        {
          type: "title",
          text: "{{otp}}",
        },
        {
          type: "text",
          text: `Код дійсний 5 хвилин. Нікому його не повідомляйте.

Якщо ви не запитували зміну email, просто проігноруйте цей лист.`,
        },
      ],
    },
  };
