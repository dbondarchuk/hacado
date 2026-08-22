import {
  addonsSelectedBlock,
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const waitlistEntryCreatedEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "waitlist-entry-created-email",
    name: "Новий запис у лист очікування (email)",
    subject: "Дякуємо, що приєдналися до листа очікування!",
    content: [
      {
        type: "title",
        text: "Дякуємо, що приєдналися до листа очікування!",
      },
      {
        type: "text",
        text: `Привіт, {{waitlistEntry.name}}!

Дякуємо, що обрали {{config.name}}!

Ми отримали ваш запит на приєднання до нашого листа очікування.

Ми зв’яжемося з вами, щойно з’явиться вільний час для бажаної дати.

Бажана послуга: {{waitlistEntry.option.name}}

Спеціаліст: {{waitlistEntry.member.name}}`,
      },
      addonsSelectedBlock("Додаткові опції: {{#addons}}{{name}}, {{/addons}}"),
      {
        type: "text",
        text: `З нетерпінням чекаємо на зустріч з вами!

З повагою,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
