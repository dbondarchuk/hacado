import {
  EMAIL_BRAND,
  renderUserEmailTemplate,
} from "@hacado/email-builder/static";
import { resolveLanguageFromMap, type Language } from "@hacado/i18n";
import { template } from "@hacado/utils/string";
import { UserEmailTemplates } from ".";
import { EmailTemplateKey } from "./types";

export const getEmailTemplate = async (
  type: EmailTemplateKey,
  language: Language,
  adminUrl: string,
  args: Record<string, any>,
  formId: string,
) => {
  const templates =
    resolveLanguageFromMap(UserEmailTemplates, language) ??
    UserEmailTemplates.en!;

  const templateContent = templates[type];

  const subjectTemplate = templateContent.subject;
  const subject = template(subjectTemplate, args);

  const buttonTexts = templates.buttonTexts;
  const checkboxText = templates.checkboxText;

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
