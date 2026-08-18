import { TemplatesTemplate } from "@hacado/types";

export const appointmentCanceledTextMessageTemplate: TemplatesTemplate = {
  name: "Canceled appointment text message",
  type: "text-message",
  value:
    "Hi {{fields.name}},\nYour appointment for {{ option.name }} on {{dateTime.full}} with {{member.name}} has been canceled.\n\nPlease call or message us at {{config.phone}} if you would like to book another time.\n\n{{config.name}}",
};
