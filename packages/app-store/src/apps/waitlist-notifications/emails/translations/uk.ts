import { EmailTemplates } from "../types";

const getText = (customText: string) => `
Привіт {{user.name}},

${customText}

Запитаний {{ waitlistEntry.createdAt.full }}

Клієнт: [{{ customer.name }}]({{ adminUrl }}/dashboard/customers/{{customer._id}})

Ім'я: {{ waitlistEntry.name }}

Email: {{ waitlistEntry.email }}

Телефон: {{ waitlistEntry.phone }}

Обрана опція: {{ waitlistEntry.option.name }}

Спеціаліст: {{member.name}}

Обрані додатки:

{{#waitlistEntry.addons}}
1. {{name}}
{{/waitlistEntry.addons}}
{{^waitlistEntry.addons}}
- Жодного
{{/waitlistEntry.addons}}

{{#waitlistEntry.note}}
Примітка: {{.}}
{{/waitlistEntry.note}}

{{#waitlistEntry.asSoonAsPossible}}
Час: якнайшвидше
{{/waitlistEntry.asSoonAsPossible}}
{{^waitlistEntry.asSoonAsPossible}}
Час:

{{#waitlistEntry.dates}}
- {{date.dateHuge}}:{{#isMorning}} Ранок (до 12:00){{/isMorning}}{{#isAfternoon}} День (12:00 - 16:00){{/isAfternoon}}{{#isEvening}} Вечір (після 16:00){{/isEvening}}
{{/waitlistEntry.dates}}
{{/waitlistEntry.asSoonAsPossible}}

{{#waitlistEntry.duration}}
Тривалість: {{#hours}}{{.}} год {{/hours}}{{#minutes}}{{.}} хв{{/minutes}}
{{/waitlistEntry.duration}}
`;

export const UkEmailTemplates: EmailTemplates = {
  newWaitlistEntry: {
    title:
      "Новий запис в чергу на {{waitlistEntry.option.name}} від {{waitlistEntry.name}}",
    text: getText(
      "Новий запис в чергу на {{waitlistEntry.option.name}} від {{waitlistEntry.name}}",
    ),
  },
  subject:
    "Новий запис в чергу на {{waitlistEntry.option.name}} від {{waitlistEntry.name}}",
  buttonTexts: {
    viewWaitlist: "Переглянути чергу",
    createAppointment: "Створити запис",
    dismiss: "Відхилити",
  },
};
