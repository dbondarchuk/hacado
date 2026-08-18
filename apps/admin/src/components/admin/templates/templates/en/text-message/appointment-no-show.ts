import { TemplatesTemplate } from "@hacado/types";

export const appointmentNoShowTextMessageTemplate: TemplatesTemplate = {
  name: "No-show appointment text message",
  type: "text-message",
  value:
    "Hi {{fields.name}},\nWe recorded that you did not attend your appointment for {{ option.name }} on {{dateTime.full}} with {{member.name}}.\n\nPlease call or message us at {{config.phone}} if you would like to book another time.\n\n{{config.name}}",
};
