import {
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const appointmentCanceledEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "appointment-canceled-email",
    name: "Canceled appointment email",
    subject: "Appointment canceled",
    content: [
      {
        type: "title",
        text: "Your appointment for {{option.name}} was canceled",
      },
      {
        type: "text",
        text: `Hi {{fields.name}},

Thank you for selecting {{config.name}}!

This confirms that your appointment for {{option.name}} on {{dateTime.full}} with {{member.name}} has been canceled.

Please give us a call at {{config.phone}} if you would like to book another time.

We hope to see you again soon!

Best regards,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
