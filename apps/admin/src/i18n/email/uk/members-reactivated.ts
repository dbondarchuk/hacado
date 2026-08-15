import { EmailTemplate } from "../types";

export const MembersReactivatedTemplate: EmailTemplate["membersReactivated"] = {
  subject: "Учасників команди відновлено для {{organizationName}}",
  body: {
    previewText: "Після збільшення місць учасників відновлено",
    content: [
      {
        type: "title",
        text: "Учасників команди відновлено",
      },
      {
        type: "text",
        text: `Вітаємо, **{{name}}**,

Кількість доступних місць збільшилась. Наступних учасників автоматично відновлено:

{{memberNames}}

Залишилось місць: **{{remainingSlots}}**.
`,
      },
    ],
  },
};
