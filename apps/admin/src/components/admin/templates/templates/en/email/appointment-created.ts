import {
  addonsSelectedBlock,
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const appointmentCreatedEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "appointment-created-email",
    name: "New appointment email",
    subject: "Your appointment request has been received",
    content: [
      {
        type: "title",
        text: "New appointment request for {{option.name}}",
      },
      {
        type: "text",
        text: `Hi {{fields.name}},

Thank you for selecting {{config.name}}!

We will confirm your appointment for {{dateTime.full}} shortly

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
