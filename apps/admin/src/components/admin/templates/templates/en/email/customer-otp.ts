import {
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const customerOtpEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "customer-otp-email",
    name: "Customer OTP Email",
    subject: "Your verification code",
    content: [
      {
        type: "title",
        text: "Your verification code",
      },
      {
        type: "text",
        text: `Hello, {{customer.name}}

Use the code below to sign in to {{config.name}}.`,
      },
      {
        type: "title",
        text: "{{otp}}",
        backgroundColor: "#f0f0f0",
        textColor: "#000000",
      },
      {
        type: "text",
        align: "center",
        text: `This code is valid for 5 minutes.

If you did not request this code, please ignore this email.`,
      },
      {
        type: "text",
        text: `Best regards,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
