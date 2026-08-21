import {
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const appointmentReminderEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "appointment-reminder-email",
    name: "Reminder appointment email",
    subject: "Reminder about your appointment",
    content: [
      {
        type: "title",
        text: "Reminder about your appointment for {{option.name}} on {{dateTime.full}}",
      },
      {
        type: "text",
        text: `Hi {{fields.name}},

This is a friendly reminder about your upcoming appointment on {{dateTime.full}} with {{member.name}}.

We are looking forward to seeing you!

Best regards,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
