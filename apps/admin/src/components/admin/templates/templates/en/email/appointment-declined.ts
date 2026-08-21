import {
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const appointmentDeclinedEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "appointment-declined-email",
    name: "Declined appointment email",
    subject: "Appointment declined",
    content: [
      {
        type: "title",
        text: "Appointment for {{option.name}} was canceled",
      },
      {
        type: "text",
        text: `Hi {{fields.name}},

Thank you for selecting {{config.name}}!

Unfortunately, we can not confirm your appointment for {{option.name}} on {{dateTime.full}} with {{member.name}} at this moment.

Please give us a call at {{config.phone}} or try selecting another time.

We apologize for the inconvenience!

Best regards,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
