import { EMAIL_BRAND, renderUserEmailTemplate } from "@hacado/email-builder/static";
import { fallbackLanguage, languages, type Language } from "@hacado/i18n";
import { getI18nAsync } from "@hacado/i18n/server";
import type { EmailNotificationRequest } from "@hacado/types";
import { getAdminUrl } from "@hacado/utils";
import type { GiftCardStudioPurchaseCreatedPayload } from "../models/events";
import { GiftCardStudioAdminAllKeys } from "../translations/types";

type AdminRecipient = {
  memberId: string;
  email: string;
  name: string;
  language?: string | null;
};

export const buildNewPurchaseEmailNotifications = async (
  payload: GiftCardStudioPurchaseCreatedPayload,
  admins: AdminRecipient[],
  amountFormatted: string,
  layoutArgs: Record<string, unknown> = {},
): Promise<EmailNotificationRequest[] | null> => {
  const { purchase } = payload;
  const adminUrl = getAdminUrl();
  const purchaseUrl = `${adminUrl}/dashboard/gift-card-studio/purchases?purchaseId=${purchase._id}`;

  const notifications: EmailNotificationRequest[] = [];

  for (const admin of admins) {
    if (!admin.email) {
      continue;
    }

    const locale: Language = languages.includes(admin.language as Language)
      ? (admin.language as Language)
      : fallbackLanguage;

    const t = await getI18nAsync({ locale });

    const interpolation = {
      customerName: purchase.customerName?.trim() || "—",
      customerEmail: purchase.customerEmail?.trim() || "—",
      recipientName: purchase.recipientName?.trim() || "—",
      recipientEmail: purchase.recipientEmail?.trim() || "—",
      designName: purchase.designName,
      giftCardCode: purchase.giftCardCode,
      amount: amountFormatted,
      userName: admin.name,
    };

    const subject = t(
      "app_gift-card-studio_admin.emails.newPurchase.subject" satisfies GiftCardStudioAdminAllKeys,
      interpolation,
    );

    const body = await renderUserEmailTemplate(
      {
        previewText: subject,
        content: [
          {
            type: "title",
            text: t(
              "app_gift-card-studio_admin.emails.newPurchase.title" satisfies GiftCardStudioAdminAllKeys,
              interpolation,
            ),
            level: "h2",
          },
          {
            type: "text",
            text: t(
              "app_gift-card-studio_admin.emails.newPurchase.body" satisfies GiftCardStudioAdminAllKeys,
              interpolation,
            ),
          },
          {
            type: "button",
            button: {
              text: t(
                "app_gift-card-studio_admin.emails.newPurchase.view" satisfies GiftCardStudioAdminAllKeys,
              ),
              url: purchaseUrl,
              backgroundColor: EMAIL_BRAND.primary,
            },
          },
        ],
      },
      layoutArgs,
    );

    notifications.push({
      email: {
        to: admin.email,
        subject,
        body,
      },
      handledBy:
        "app_gift-card-studio_admin.handlers.newPurchaseEmail" satisfies GiftCardStudioAdminAllKeys,
      participantType: "member",
      memberId: admin.memberId,
    });
  }

  return notifications.length ? notifications : null;
};
