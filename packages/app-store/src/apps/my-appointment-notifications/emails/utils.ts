import {
  EMAIL_BRAND,
  renderUserEmailTemplate,
} from "@hacado/email-builder/static";
import { resolveLanguageFromMap, type Language } from "@hacado/i18n";
import { Appointment, isClosedAppointmentStatus } from "@hacado/types/booking";
import { AppointmentStatusToICalMethodMap } from "@hacado/utils/email";
import { template } from "@hacado/utils/string";
import { UserEmailTemplates } from ".";

export const getEmailTemplate = async (
  status:
    | keyof typeof AppointmentStatusToICalMethodMap
    | "auto-confirmed"
    | "cancelledByCustomer"
    | "rescheduledByCustomer",
  language: Language,
  url: string,
  appointment: Appointment,
  args: Record<string, any>,
) => {
  const templates =
    resolveLanguageFromMap(UserEmailTemplates, language) ??
    UserEmailTemplates.en!;

  const templateContent = templates[status];

  const subjectTemplate = templates.subject;

  const buttonTexts = templates.buttonTexts;

  const eventTitleTemplate = templates.eventTitle;

  const eventTitle = template(eventTitleTemplate, args);
  const subject = template(subjectTemplate, args);

  const description = await renderUserEmailTemplate(
    {
      previewText: templateContent.previewText ?? templateContent.title,
      content: [
        {
          type: "button",
          button: {
            text: buttonTexts.viewAppointment,
            url: `${url}/dashboard/appointments/${appointment._id}`,
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
            text: buttonTexts.viewAppointment,
            url: `${url}/dashboard/appointments/${appointment._id}`,
          },
        },
        ...[
          !isClosedAppointmentStatus(appointment.status)
            ? {
                text: buttonTexts.decline,
                url: `${url}/dashboard/appointments/${appointment._id}/decline`,
                backgroundColor: EMAIL_BRAND.destructive,
              }
            : undefined,
          appointment.status === "pending"
            ? {
                text: buttonTexts.confirm,
                url: `${url}/dashboard/appointments/${appointment._id}/confirm`,
                backgroundColor: EMAIL_BRAND.primary,
              }
            : undefined,
        ]
          .filter((button) => !!button)
          .map((button) => ({
            type: "button" as const,
            button,
          })),
      ],
    },
    args,
  );

  return {
    template: description,
    subject,
    eventTitle,
  };
};
