import { TemplatesTemplate } from "@timelish/types";

export const appointmentRescheduledTextMessageTemplate: TemplatesTemplate = {
  name: "Rescheduled appointment text message",
  type: "text-message",
  value:
    "Hi {{fields.name}},\nYour appointment for {{option.name}} with {{member.name}} was rescheduled for {{dateTime.full}}.\n\nPlease call or message us at {{config.phone}} if you have any questions!\n\nLooking forward to seeing you!\n{{config.name}}",
};
