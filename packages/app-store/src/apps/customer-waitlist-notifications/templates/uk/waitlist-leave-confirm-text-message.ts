import { TemplatesTemplate } from "@hacado/types";

export const waitlistLeaveConfirmTextMessageTemplate: TemplatesTemplate = {
  name: "SMS-підтвердження виходу з листа очікування",
  type: "text-message",
  value:
    "Привіт, {{waitlistEntry.name}}! Вас видалено з листа очікування для {{waitlistEntry.option.name}} у {{config.name}}.",
};
