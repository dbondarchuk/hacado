import {
  getOrganizationId,
  getServicesContainer,
  getWebsiteUrl,
} from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { getSessionPlanTier } from "@/lib/billing/subscription-plan-access";
import { getLoggerFactory } from "@hacado/logger";
import {
  requiresSmsVerification,
  saveSmsRegistration,
  SystemServicesContainer,
} from "@hacado/services";
import {
  BillingPlanTier,
  meetsMinimumPlanTier,
  memberEventSource,
  smsRegistrationInputSchema,
} from "@hacado/types";
import { getWebsiteUrl as organizationWebsiteUrl } from "@hacado/utils";
import { NextRequest, NextResponse } from "next/server";
import { publicPageUrl, storeOptInImage } from "../shared";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory(
    "AdminAPI/settings/text-messaging/verification",
  )("POST");
  const auth = await requirePermission("settings", "update", logger);
  if (!auth.ok) return auth.response;
  if (
    !meetsMinimumPlanTier(
      getSessionPlanTier(auth.session),
      BillingPlanTier.Solo,
    )
  ) {
    return NextResponse.json(
      { success: false, code: "forbidden", error: "Forbidden" },
      { status: 403 },
    );
  }

  const json = await request.json().catch(() => null);
  const optInImage =
    json && typeof json === "object" && typeof json.optInImage === "string"
      ? json.optInImage
      : undefined;

  if (json && typeof json === "object") delete json.optInImage;
  const registration = smsRegistrationInputSchema.safeParse(json);
  if (!registration.success) {
    return NextResponse.json(
      {
        success: false,
        code: "invalid",
        error: "Invalid text messaging details",
      },
      { status: 400 },
    );
  }

  const services = await getServicesContainer();
  const organizationId = await getOrganizationId();
  const [general, textMessaging, organization, websiteUrl] = await Promise.all([
    services.configurationService.getConfiguration("general"),
    services.configurationService.getConfiguration("textMessaging"),
    services.organizationService.getOrganization(),
    getWebsiteUrl(),
  ]);

  if (
    !requiresSmsVerification(general.country) ||
    textMessaging?.enabled !== true
  ) {
    return NextResponse.json(
      {
        success: false,
        code: "sms_disabled",
        error: "Text messaging is not enabled",
      },
      { status: 400 },
    );
  }

  const optInImageUrl = await storeOptInImage({
    services,
    memberId: auth.user.memberId,
    websiteUrl,
    dataUrl: optInImage,
    logger,
  });

  const [privacyPolicyUrl, termsAndConditionUrl] = await Promise.all([
    publicPageUrl(services, websiteUrl, textMessaging.privacyPageId),
    publicPageUrl(services, websiteUrl, textMessaging.termsPageId),
  ]);

  const result = await saveSmsRegistration({
    organizationId,
    country: general.country,
    values: {
      ...registration.data,
      website: organization ? organizationWebsiteUrl(organization) : "",
    },
    optInImageUrl,
    privacyPolicyUrl,
    termsAndConditionUrl,
    notifyEmail: auth.user.email,
    sendEmail: (email) =>
      SystemServicesContainer().notificationService.sendSystemEmail(email),
    emit: (type, payload) =>
      services.eventService.emit(
        type,
        payload,
        memberEventSource(auth.user.memberId),
      ),
  });

  if ("error" in result) {
    logger.warn({ error: result.error }, "SMS registration was not submitted");
    return NextResponse.json(
      { success: false, code: "submit_failed", error: result.error },
      { status: 502 },
    );
  }

  logger.info({ outcome: result.outcome }, "SMS registration saved");
  return NextResponse.json(result);
}
