import {
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const appointmentNoShowEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "appointment-no-show-email",
    name: "No-show appointment email",
    subject: "Appointment marked as no-show",
    content: [
      {
        type: "title",
        text: "You were marked as a no-show for {{option.name}}",
      },
      {
        type: "text",
        text: `Hi {{fields.name}},

Thank you for selecting {{config.name}}!

We recorded that you did not attend your appointment for {{option.name}} on {{dateTime.full}} with {{member.name}}.

Please give us a call at {{config.phone}} if you would like to book another time.

We apologize for the inconvenience!

Best regards,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
