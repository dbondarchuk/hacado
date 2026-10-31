import { resolveLanguageFromMap, type Language } from "@hacado/i18n";
import { SystemServicesContainer } from "@hacado/services/container";
import { templateSafeWithError } from "@hacado/utils/string";
import { renderUserEmailTemplate } from "../../../../../packages/email-builder/src/static/user-email-template";
import { EmailTemplates } from "../../i18n/email";
import { EmailTemplate } from "../../i18n/email/types";

export const sendEmail = async (
  template: keyof EmailTemplate,
  email: string,
  language: Language,
  args: Record<string, any>,
) => {
  const serviceContainer = SystemServicesContainer();

  const languageTemplates =
    resolveLanguageFromMap(EmailTemplates, language) ?? EmailTemplates.en!;

  const emailTemplate = languageTemplates[template];

  const emailBody = await renderUserEmailTemplate(emailTemplate.body, args);
  const emailSubject = templateSafeWithError(emailTemplate.subject, args);

  await serviceContainer.notificationService.sendSystemEmail({
    to: [email],
    subject: emailSubject,
    body: emailBody,
  });
};
