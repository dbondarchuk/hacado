import { renderUserEmailTemplate } from "@hacado/email-builder/static";
import { BaseAllKeys } from "@hacado/i18n";
import { getI18nAsync } from "@hacado/i18n/server";
import {
  type CustomerPackageIssuedPayload,
  type EmailNotificationRequest,
  type EventEnvelope,
  type IServicesContainer,
} from "@hacado/types";
import { formatAmountWithCurrency, getAdminUrl } from "@hacado/utils";

import { dashboardUrls } from "../links";

const EMAIL_KEY_PREFIX =
  "admin.services.packages.emails.purchasedOwner" as const;

export async function buildCustomerPackagePurchasedOwnerEmails(
  envelope: EventEnvelope,
  services: IServicesContainer,
): Promise<EmailNotificationRequest[] | null> {
  const { customerPackage } = envelope.payload as CustomerPackageIssuedPayload;
  if (customerPackage.channel !== "customer") {
    return null;
  }

  const admins = await services.teamService.getOrganizationAdminContacts();
  if (!admins.length) return null;

  const organization = await services.organizationService.getOrganization();
  const organizationLabel =
    organization?.name?.trim() || organization?.slug || "";
  const layoutArgs = {
    config: organizationLabel ? { name: organizationLabel } : {},
  };

  const customer = await services.customersService.getCustomer(
    customerPackage.customerId,
  );
  const { general, brand } =
    await services.configurationService.getConfigurations("general", "brand");
  const price = formatAmountWithCurrency(
    customerPackage.price,
    brand.language,
    general.currency,
  );
  const customerName =
    customer?.name?.trim() ||
    customer?.email?.trim() ||
    customerPackage.customerId;
  const soldUrl = `${getAdminUrl()}${dashboardUrls.customer(customerPackage.customerId)}?tab=packages`;

  const notifications: EmailNotificationRequest[] = [];
  for (const admin of admins) {
    if (!admin.email) continue;
    const t = await getI18nAsync({ locale: admin.language });
    const interpolation = {
      packageName: customerPackage.name,
      customerName,
      price,
    };
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
              url: soldUrl,
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
