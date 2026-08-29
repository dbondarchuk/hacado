import {
  EMAIL_BRAND,
  addonsSelectedBlock,
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const waitlistSlotOpenedEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "waitlist-slot-opened-email",
    name: "Waitlist slot opened email",
    subject: "A time opened for {{waitlistEntry.option.name}}",
    content: [
      {
        type: "title",
        text: "A time slot just opened",
      },
      {
        type: "text",
        text: `Hi {{waitlistEntry.name}},

A time matching your waitlist request is available{{#isMorning}} in the morning{{/isMorning}}{{#isAfternoon}} in the afternoon{{/isAfternoon}}{{#isEvening}} in the evening{{/isEvening}}:

Service: {{waitlistEntry.option.name}}
Specialist: {{waitlistEntry.member.name}}
When: {{slotDateTime.full}}{{#hasOtherTimes}} (and other times too){{/hasOtherTimes}}

Book now to claim this time. If you no longer need it, you can leave the waitlist.`,
      },
      addonsSelectedBlock(),
      {
        type: "button",
        button: {
          text: "Book this time",
          url: "{{bookingUrl}}",
        },
      },
      {
        type: "button",
        button: {
          text: "Leave waitlist",
          url: "{{leaveWaitlistUrl}}",
          backgroundColor: EMAIL_BRAND.destructive,
        },
      },
      {
        type: "text",
        text: `Best regards,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
