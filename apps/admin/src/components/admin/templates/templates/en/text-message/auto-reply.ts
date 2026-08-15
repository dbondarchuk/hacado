import { TemplatesTemplate } from "@hacado/types";

export const autoReplyTextMessageTemplate: TemplatesTemplate = {
  name: "Text message auto reply",
  type: "text-message",
  value:
    "Hi{{#customer.name}} {{.}}{{/customer.name}},\nThis is an unmonitored phone number. Please send your reply to {{config.phone}}.\n\nThanks,\n{{config.name}} ",
};
