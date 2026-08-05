import { EmailTemplate } from "../types";

export const TeamInvitationTemplate: EmailTemplate["teamInvitation"] = {
  subject: "Вас запрошено до {{organizationName}}",
  body: {
    previewText: "Приєднайтеся до {{organizationName}} на Hacado",
    content: [
      {
        type: "title",
        text: "Запрошення до команди",
      },
      {
        type: "text",
        text: `Вітаємо,

**{{inviterName}}** запрошує вас приєднатися до **{{organizationName}}** як **{{role}}**.

Натисніть кнопку нижче, щоб прийняти запрошення.
`,
      },
      {
        type: "button",
        button: {
          text: "Прийняти запрошення",
          url: "{{url}}",
        },
      },
      {
        type: "text",
        text: `> **Кнопка не працює?**

> <span style="font-size: 12px;">Скопіюйте посилання нижче у браузер:</span>

> <span style="font-size: 12px;">{{url}}</span>
---

<span style="font-size: 12px;">Запрошення дійсне 2 днів. Якщо ви не очікували цього листа, просто ігноруйте його.</span>`,
      },
    ],
  },
};
