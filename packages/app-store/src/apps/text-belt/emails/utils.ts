import { renderUserEmailTemplate, EMAIL_BRAND } from "@hacado/email-builder/static";
import { Language } from "@hacado/i18n";
import { template } from "@hacado/utils";
import { UserEmailTemplates } from ".";
import { EmailTemplateKey } from "./types";

export const getEmailTemplate = async (
  type: EmailTemplateKey,
  language: Language,
  url: string,
  args: Record<string, any>,
  appointmentId?: string,
  customerId?: string,
) => {
  const templateContent =
    UserEmailTemplates[language]?.[type] ?? UserEmailTemplates["en"][type];

  const subjectTemplate = templateContent.subject;

  const buttonTexts =
    UserEmailTemplates[language]?.buttonTexts ??
    UserEmailTemplates["en"].buttonTexts;

  const subject = template(subjectTemplate, args);

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
