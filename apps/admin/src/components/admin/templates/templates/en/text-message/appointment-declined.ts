import { TemplatesTemplate } from "@timelish/types";

export const appointmentDeclinedTextMessageTemplate: TemplatesTemplate = {
  name: "Declined appointment text message",
  type: "text-message",
  value:
    "Hi {{fields.name}},\nYour appointment for {{ option.name }} on {{dateTime.full}} with {{member.name}} was declined or canceled.\n\nPlease call or message us at {{config.phone}} if you have any questions!\n\nLooking forward to seeing you!\n{{config.name}}",
};
