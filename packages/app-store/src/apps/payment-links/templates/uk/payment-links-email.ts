import { buildCustomerEmailTemplate } from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const paymentLinksEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "payment-links-email",
    name: "Посилання на оплату",
    subject: "Запит на оплату від {{config.name}}",
    content: [
      {
        type: "title",
        text: "У вас є запит на оплату",
      },
      {
        type: "text",
        text: `Привіт, {{customer.name}},

{{config.name}} надіслав(ла) вам запит на оплату на суму {{payment.amountFormatted}}.

Натисніть кнопку нижче, щоб оплатити безпечно.`,
      },
      {
        type: "button",
        button: {
          text: "Сплатити",
          url: "{{paymentLinkUrl}}",
        },
      },
      {
        type: "text",
        text: `Якщо кнопка не працює, скопіюйте та вставте це посилання в браузер:
{{paymentLinkUrl}}

З повагою,

{{config.name}}`,
      },
    ],
  });
