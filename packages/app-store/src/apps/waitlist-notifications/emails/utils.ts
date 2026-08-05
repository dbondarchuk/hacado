import { renderUserEmailTemplate, EMAIL_BRAND } from "@hacado/email-builder/static";
import { Language } from "@hacado/i18n";
import { template } from "@hacado/utils";
import { UserEmailTemplates } from ".";
import { WaitlistEntry } from "../../waitlist/models/waitlist";

export const getEmailTemplate = async (
  status: "newWaitlistEntry",
  language: Language,
  url: string,
  entry: WaitlistEntry,
  args: Record<string, any>,
) => {
  const templateContent =
    UserEmailTemplates[language]?.[status] ?? UserEmailTemplates["en"][status];

  const subjectTemplate = templateContent.title;

  const buttonTexts =
    UserEmailTemplates[language]?.buttonTexts ??
    UserEmailTemplates["en"].buttonTexts;

  const subject = template(subjectTemplate, args);

  const description = await renderUserEmailTemplate(
    {
      previewText: templateContent.previewText ?? templateContent.title,
      content: [
        {
          type: "button",
          button: {
            text: buttonTexts.viewWaitlist,
            url: `${url}/dashboard/waitlist`,
          },
        },
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
            text: buttonTexts.dismiss,
            url: `${url}/dashboard/waitlist/dismiss?id=${entry._id}`,
            backgroundColor: EMAIL_BRAND.destructive,
          },
        },
        {
          type: "button",
          button: {
            text: buttonTexts.createAppointment,
            url: `${url}/dashboard/waitlist/appointment/new?id=${entry._id}`,
            backgroundColor: EMAIL_BRAND.primary,
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
