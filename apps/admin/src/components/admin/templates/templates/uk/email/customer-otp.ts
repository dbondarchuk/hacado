import {
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const customerOtpEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "customer-otp-email",
    name: "OTP лист для клієнта",
    subject: "Ваш код підтвердження",
    content: [
      {
        type: "title",
        text: "Ваш код підтвердження",
      },
      {
        type: "text",
        text: `Вітаємо, {{customer.name}}

Використайте код нижче для входу до {{config.name}}.`,
      },
      {
        type: "title",
        text: "{{otp}}",
      },
      {
        type: "text",
        align: "center",
        text: `Код дійсний протягом 5 хвилин.

Якщо ви не запитували цей код, проігноруйте цей лист.`,
      },
      {
        type: "text",
        text: `З повагою,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
