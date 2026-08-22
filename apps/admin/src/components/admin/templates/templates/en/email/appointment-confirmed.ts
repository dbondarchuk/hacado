import {
  addonsSelectedBlock,
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const appointmentConfirmedEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "appointment-confirmed-email",
    name: "Confirmed appointment email",
    subject: "Appointment confirmed",
    content: [
      {
        type: "title",
        text: "Appointment for {{option.name}} was confirmed",
      },
      {
        type: "text",
        text: `Hi {{fields.name}},

Thank you for selecting {{config.name}}!

We have confirmed your appointment on {{dateTime.full}}

Service requested: {{option.name}}

Specialist: {{member.name}}`,
      },
      addonsSelectedBlock(),
      {
        type: "text",
        text: `Time: {{dateTime.full}}

Duration: {{#duration.hours}}{{.}} hr {{/duration.hours}}{{#duration.minutes}}{{.}} min{{/duration.minutes}}

Price: {{totalPriceFormatted}}

We are looking forward to seeing you!

Best regards,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
