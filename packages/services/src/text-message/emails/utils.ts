import {
  EMAIL_BRAND,
  renderUserEmailTemplate,
} from "@hacado/email-builder/static";
import { resolveLanguageFromMap, type Language } from "@hacado/i18n";
import { template } from "@hacado/utils/string";
import { InboundReplyEmailTemplates } from ".";
import { EmailTemplateKey } from "./types";

export const getInboundReplyEmailTemplate = async (
  type: EmailTemplateKey,
  language: Language,
  url: string,
  args: Record<string, any>,
  appointmentId?: string,
  customerId?: string,
) => {
  const templates =
    resolveLanguageFromMap(InboundReplyEmailTemplates, language) ??
    InboundReplyEmailTemplates.en!;

  const templateContent = templates[type];
  const subject = template(templateContent.subject, args);
  const buttonTexts = templates.buttonTexts;

  const description = await renderUserEmailTemplate(
    {
      previewText: templateContent.previewText ?? templateContent.title,
      content: [
        {
          type: "title",
          text: templateContent.title,
        },
        {
          type: "text",
          text: templateContent.text,
        },
        {
          type: "button",
          button: {
            text: buttonTexts.viewAppointment,
            url: `${url}/dashboard/appointments/${appointmentId}`,
          },
        },
        {
          type: "button",
          button: {
            text: buttonTexts.viewCustomer,
            url: `${url}/dashboard/customers/${customerId}`,
            backgroundColor: EMAIL_BRAND.primaryDark,
          },
        },
      ],
    },
    args,
  );

  return {
    template: description,
    subject,
  };
};
