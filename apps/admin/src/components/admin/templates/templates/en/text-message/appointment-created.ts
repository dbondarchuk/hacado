import { TemplatesTemplate } from "@timelish/types";

export const appointmentCreatedTextMessageTemplate: TemplatesTemplate = {
  name: "New appointment request text message",
  type: "text-message",
  value:
    "Hi {{fields.name}},\nThank you for selecting {{config.name}}!\nWe have received your appointment request on {{dateTime.full}} for {{ option.name }} with {{member.name}}. We will confirm it shortly.\n\nIn the mean time, please call or message me at {{config.phone}} if you have any questions!\n\nLooking forward to seeing you!\n{{config.name}}",
};
