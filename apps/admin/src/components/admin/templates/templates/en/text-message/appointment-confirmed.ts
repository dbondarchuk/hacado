import { TemplatesTemplate } from "@timelish/types";
export const appointmentConfirmedTextMessageTemplate: TemplatesTemplate = {
  name: "Confirmed appointment text message",
  type: "text-message",
  value:
    "Hi {{fields.name}},\nThank you for selecting {{config.name}}!\nWe have confirmed your appointment on {{dateTime.full}} for {{ option.name }} with {{member.name}}.\n\nPlease call or message us at {{config.phone}} if you have any questions!\n\nLooking forward to seeing you!\n{{config.name}}",
};
