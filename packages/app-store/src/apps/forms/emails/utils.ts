import {
  EMAIL_BRAND,
  renderUserEmailTemplate,
} from "@hacado/email-builder/static";
import { Language } from "@hacado/i18n";
import { template } from "@hacado/utils";
import { UserEmailTemplates } from ".";
import { EmailTemplateKey } from "./types";

export const getEmailTemplate = async (
  type: EmailTemplateKey,
  language: Language,
  adminUrl: string,
  args: Record<string, any>,
  formId: string,
) => {
  const templateContent =
    UserEmailTemplates[language]?.[type] ?? UserEmailTemplates.en[type];

  const subjectTemplate = templateContent.subject;
  const subject = template(subjectTemplate, args);

  const buttonTexts =
    UserEmailTemplates[language]?.buttonTexts ??
    UserEmailTemplates.en.buttonTexts;

  const checkboxText =
    UserEmailTemplates[language]?.checkboxText ??
    UserEmailTemplates.en.checkboxText;

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
            text: buttonTexts.viewResponse,
            url: `${adminUrl}/dashboard/forms/responses/edit?id=${formId}`,
          },
        },
        {
          type: "button",
          button: {
            text: buttonTexts.viewAllResponses,
            url: `${adminUrl}/dashboard/forms/responses?formId=${formId}`,
            backgroundColor: EMAIL_BRAND.primaryDark,
          },
        },
      ],
    },
    { ...args, checkboxText },
  );

  return {
    template: description,
    subject,
  };
};
