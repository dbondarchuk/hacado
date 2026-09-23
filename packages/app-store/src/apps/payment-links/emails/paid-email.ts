import {
  EMAIL_BRAND,
  renderUserEmailTemplate,
} from "@hacado/email-builder/static";
import { fallbackLanguage, languages, type Language } from "@hacado/i18n";
import { getI18nAsync } from "@hacado/i18n/server";
import type {
  EmailNotificationRequest,
  PaymentLinkPayment,
} from "@hacado/types";
import { getAdminUrl } from "@hacado/utils";
import { PaymentLinksAdminAllKeys } from "../translations/types";

export type PaidEmailRecipient = {
  memberId: string;
  email: string;
  name: string;
  language?: string | null;
};

export type PaidEmailContext = {
  payment: PaymentLinkPayment;
  amountFormatted: string;
  tipFormatted?: string;
  paidAtFormatted: string;
  customerName: string;
  customerUrl: string;
  appointmentLabel?: string;
  appointmentUrl?: string;
  organizationName?: string;
};

export const buildPaymentPaidEmailNotifications = async (
  context: PaidEmailContext,
  recipients: PaidEmailRecipient[],
  layoutArgs: Record<string, unknown> = {},
): Promise<EmailNotificationRequest[] | null> => {
  const adminUrl = getAdminUrl();
  const paymentUrl = `${adminUrl}/dashboard/financials/payments?id=${encodeURIComponent(context.payment._id)}`;
  const customerLink = `[${context.customerName}](${context.customerUrl})`;
  const appointmentText = context.appointmentLabel?.trim() || "-";
  const appointmentLink =
    context.appointmentUrl && context.appointmentLabel?.trim()
      ? `[${context.appointmentLabel.trim()}](${context.appointmentUrl})`
      : appointmentText;
  const notifications: EmailNotificationRequest[] = [];

  for (const recipient of recipients) {
    if (!recipient.email) {
      continue;
    }

    const locale: Language = languages.includes(recipient.language as Language)
      ? (recipient.language as Language)
      : fallbackLanguage;

    const t = await getI18nAsync({ locale });

    const tipLine = context.tipFormatted
      ? t(
          "app_payment-links_admin.emails.paid.tipLine" satisfies PaymentLinksAdminAllKeys,
          { tip: context.tipFormatted },
        )
      : "";

    const interpolation = {
      userName: recipient.name,
      customerName: context.customerName,
      customerLink,
      amount: context.amountFormatted,
      tipLine,
      paidAt: context.paidAtFormatted,
      appointment: appointmentText,
      appointmentLink,
    };

    const subject = t(
      "app_payment-links_admin.emails.paid.subject" satisfies PaymentLinksAdminAllKeys,
      interpolation,
    );

    const body = await renderUserEmailTemplate(
      {
        previewText: subject,
        content: [
          {
            type: "title",
            text: t(
              "app_payment-links_admin.emails.paid.title" satisfies PaymentLinksAdminAllKeys,
              interpolation,
            ),
            level: "h2",
          },
          {
            type: "text",
            text: t(
              "app_payment-links_admin.emails.paid.body" satisfies PaymentLinksAdminAllKeys,
              interpolation,
            ),
          },
          {
            type: "button",
            button: {
              text: t(
                "app_payment-links_admin.emails.paid.viewPayment" satisfies PaymentLinksAdminAllKeys,
              ),
              url: paymentUrl,
              backgroundColor: EMAIL_BRAND.primary,
            },
          },
        ],
      },
      layoutArgs,
    );

    notifications.push({
      email: {
        to: recipient.email,
        subject,
        body,
      },
      handledBy:
        "app_payment-links_admin.handlers.paymentPaid" satisfies PaymentLinksAdminAllKeys,
      participantType: "member",
      memberId: recipient.memberId,
      customerId: context.payment.customerId,
    });
  }

  return notifications.length ? notifications : null;
};
