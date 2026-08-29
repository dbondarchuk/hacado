import { TemplatesTemplate } from "@hacado/types";

export const waitlistLeaveConfirmTextMessageTemplate: TemplatesTemplate = {
  name: "Waitlist leave confirmation text message",
  type: "text-message",
  value:
    "Hi {{waitlistEntry.name}}, you have been removed from the waitlist for {{waitlistEntry.option.name}} at {{config.name}}.",
};
