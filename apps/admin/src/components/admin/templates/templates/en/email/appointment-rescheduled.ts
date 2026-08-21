import {
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const appointmentRescheduledEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "appointment-rescheduled-email",
    name: "Rescheduled appointment email",
    subject: "Appointment rescheduled",
    content: [
      {
        type: "title",
        text: "Appointment for {{option.name}} was rescheduled",
      },
      {
        type: "text",
        text: `Hi {{fields.name}},

Thank you for selecting {{config.name}}!

Your appointment for {{option.name}} with {{member.name}} was rescheduled for {{dateTime.full}} and duration: {{#duration.hours}}{{.}} hr {{/duration.hours}}{{#duration.minutes}}{{.}} min{{/duration.minutes}}.

Please give us a call at {{config.phone}} as soon as possible if this time does not work for you.

We are looking forward to seeing you!

Best regards,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
