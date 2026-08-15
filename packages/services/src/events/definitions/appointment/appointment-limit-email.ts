import { renderUserEmailTemplate } from "@hacado/email-builder/static";
import { BaseAllKeys } from "@hacado/i18n";
import { getI18nAsync } from "@hacado/i18n/server";
import {
  BillingPlanTier,
  FREE_TIER_LIMITS,
  type EmailNotificationRequest,
  type EventEnvelope,
  type IServicesContainer,
} from "@hacado/types";
import { getAdminUrl } from "@hacado/utils";

import { getNonDeclinedAppointmentsCreatedInBillingCycleCount } from "../../../billing/free-tier-appointment-usage";
import { resolvePlanTierFromOrganization } from "../../../billing/subscription-entitlements";
import { dashboardUrls } from "../links";

const EMAIL_KEY_PREFIX =
  "admin.billing.emails.appointmentLimitReached" as const;

export async function buildAppointmentLimitReachedEmails(
  envelope: EventEnvelope,
  services: IServicesContainer,
): Promise<EmailNotificationRequest[] | null> {
  const organization = await services.organizationService.getOrganization();
  const planTier = resolvePlanTierFromOrganization(organization);
  if (planTier !== BillingPlanTier.Free) {
    return null;
  }

  const count = await getNonDeclinedAppointmentsCreatedInBillingCycleCount(
    envelope.organizationId,
    services.billingService,
  );
  if (count !== FREE_TIER_LIMITS.appointments) {
    return null;
  }

  const admins = await services.teamService.getOrganizationAdminContacts();
  if (!admins.length) return null;

  const organizationLabel =
    organization?.name?.trim() || organization?.slug || "";
  const layoutArgs = {
    config: organizationLabel ? { name: organizationLabel } : {},
  };
  const interpolation = { limit: FREE_TIER_LIMITS.appointments };
  const upgradeUrl = `${getAdminUrl()}${dashboardUrls.billing}?activeTab=general`;

  const notifications: EmailNotificationRequest[] = [];
  for (const admin of admins) {
    if (!admin.email) continue;
    const t = await getI18nAsync({ locale: admin.language });
    const subject = t(`${EMAIL_KEY_PREFIX}.subject`, interpolation);
    const body = await renderUserEmailTemplate(
      {
        previewText: t(`${EMAIL_KEY_PREFIX}.preview`, interpolation),
        content: [
          {
            type: "title",
            text: t(`${EMAIL_KEY_PREFIX}.title`, interpolation),
            level: "h2",
          },
          {
            type: "text",
            text: t(`${EMAIL_KEY_PREFIX}.body`, interpolation),
          },
          {
            type: "button",
            button: {
              text: t(`${EMAIL_KEY_PREFIX}.button`, interpolation),
              url: upgradeUrl,
            },
          },
        ],
      },
      layoutArgs,
    );

    notifications.push({
      email: { to: admin.email, subject, body },
      handledBy: `${EMAIL_KEY_PREFIX}.handledBy` as BaseAllKeys,
      participantType: "member",
      memberId: admin.memberId,
    });
  }

  return notifications.length ? notifications : null;
}
