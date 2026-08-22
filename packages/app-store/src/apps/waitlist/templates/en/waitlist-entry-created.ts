import {
  addonsSelectedBlock,
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const waitlistEntryCreatedEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "waitlist-entry-created-email",
    name: "New waitlist entry email",
    subject: "Thank you for joining the waitlist!",
    content: [
      {
        type: "title",
        text: "Thank you for joining the waitlist!",
      },
      {
        type: "text",
        text: `Hi {{waitlistEntry.name}},

Thank you for selecting {{config.name}}!

We have received your request to join our waitlist.

We will get in touch with you as soon as a time slot opens up for your desired date.

Service requested: {{waitlistEntry.option.name}}

Specialist: {{waitlistEntry.member.name}}`,
      },
      addonsSelectedBlock(),
      {
        type: "text",
        text: `We are looking forward to seeing you!

Best regards,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
