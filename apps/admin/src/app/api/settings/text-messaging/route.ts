import { getServicesContainer, getSession } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { getSessionPlanTier } from "@/lib/billing/subscription-plan-access";
import { getLoggerFactory } from "@hacado/logger";
import { BillingPlanTier, meetsMinimumPlanTier } from "@hacado/types/billing";
import { textMessagingConfigurationSchema } from "@hacado/types/configuration/text-messaging";
import { memberEventSource } from "@hacado/types/events";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const logger = getLoggerFactory("AdminAPI/settings/text-messaging")("GET");
  const session = await getSession();
  if (!session?.user) {
    logger.warn("Unauthorized");
    return NextResponse.json(
      { success: false, code: "unauthorized", error: "Unauthorized" },
      { status: 401 },
    );
  }

  const services = await getServicesContainer();
  const access =
    await services.textMessageConfigurationService.getSmsMessagingAccess();

  return NextResponse.json(access);
}

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/settings/text-messaging")("POST");
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
  const config = textMessagingConfigurationSchema.safeParse(json);
  if (!config.success) {
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
  await services.configurationService.setConfiguration(
    "textMessaging",
    config.data,
    memberEventSource(auth.user.memberId),
  );

  logger.info(
    { enabled: config.data.enabled },
    "Text messaging settings saved",
  );
  return NextResponse.json({ success: true });
}
