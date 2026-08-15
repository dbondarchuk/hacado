import { EmailTemplate } from "../types";

export const ChangeEmailTemplate: EmailTemplate["changeEmail"] = {
  subject: "Зміна вашої електронної адреси",
  body: {
    previewText: "Зміна вашої електронної адреси",
    content: [
      {
        type: "title",
        text: "Зміна вашої електронної адреси",
      },
      {
        type: "text",
        text: `Привіт **{{name}}**,

Ви запросили зміну вашої електронної адреси на **{{newEmail}}**. Натисніть на кнопку нижче, щоб підтвердити цю зміну.
`,
      },
      {
        type: "button",
        button: {
          text: "Підтвердити зміну електронної адреси",
          url: "{{url}}",
        },
      },
      {
        type: "text",
        text: `> **Кнопка не працює?** 

> <span style="font-size: 12px;">Скопіюйте та вставте посилання нижче в ваш браузер:</span>

> <span style="font-size: 12px;">{{url}}</span>
---

#### Important Notes

- <span style="font-size: 12px;">Цей посилання на зміну електронної адреси **закінчується через 24 години**</span>
- <span style="font-size: 12px;">Якщо ви **не запитували** зміну електронної адреси, ігноруйте цей email - не потрібно ніякої дії</span>
- <span style="font-size: 12px;">**Ніколи не діліться** цим посиланням з будь-ким для безпеки вашого облікового запису</span>
---`,
      },
    ],
  },
};
