import { TemplatesTemplate } from "@timelish/types";

export const appointmentReminderTextMessageTemplate: TemplatesTemplate = {
  name: "Reminder appointment text message",
  type: "text-message",
  value:
    "Hi {{fields.name}},\nThis is a friendly reminder about your upcoming appointment on {{dateTime.full}} with {{member.name}}.\n\nPlease call or message us at {{config.phone}} if you have any questions!\n\nLooking forward to seeing you!\n{{config.name}}",
};
