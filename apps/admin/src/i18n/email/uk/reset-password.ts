import { EmailTemplate } from "../types";

export const ResetPasswordTemplate: EmailTemplate["resetPassword"] = {
  subject: "Зміна вашого пароля",
  body: {
    previewText: "Зміна вашого пароля",
    content: [
      {
        type: "title",
        text: "Зміна вашого пароля",
      },
      {
        type: "text",
        text: `Привіт **{{name}}**,

Змініть ваш пароль, натиснувши на кнопку нижче. Це допомагає нам підтвердити, що ви є власником цієї електронної пошти і зберігає ваш обліковий запис в безпеці.
`,
      },
      {
        type: "button",
        button: {
          text: "Змінити мой пароль",
          url: "{{url}}",
        },
      },
      {
        type: "text",
        text: `> **Кнопка не працює?** 

> <span style="font-size: 12px;">Скопіюйте та вставте посилання нижче в ваш браузер:</span>

> <span style="font-size: 12px;">{{url}}</span>
---

### Важливі зауваження

- <span style="font-size: 12px;">Цей посилання на зміну пароля **закінчується через 24 години**</span>
- <span style="font-size: 12px;">Якщо ви **не запитували** зміну пароля, ігноруйте цей email - не потрібно ніякої дії</span>
- <span style="font-size: 12px;">**Ніколи не діліться** цим посиланням з будь-ким для безпеки вашого облікового запису</span>
---`,
      },
    ],
  },
};
