import {
  getOrganizationId,
  getServicesContainer,
  getSession,
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
  const [access, general] = await Promise.all([
    services.notificationService.getSmsMessagingAccess(),
    services.configurationService.getConfiguration("general"),
  ]);

  return NextResponse.json({
    ...access,
    platformBusiness: requiresSmsVerification(general.country),
  });
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
  const optInImage =
    json && typeof json === "object" && typeof json.optInImage === "string"
      ? json.optInImage
      : undefined;
  if (json && typeof json === "object") delete json.optInImage;
  const parsed = smsRegistrationInputSchema.safeParse(json);
  if (!parsed.success) {
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
  const [general, websiteUrl] = await Promise.all([
    services.configurationService.getConfiguration("general"),
    getWebsiteUrl(),
  ]);
  const optInImageUrl = await storeOptInImage({
    services,
    memberId: auth.user.memberId,
    websiteUrl,
    dataUrl: optInImage,
    logger,
  });
  const result = await saveSmsRegistration({
    organizationId,
    country: general.country,
    values: parsed.data,
    optInImageUrl,
    notifyEmail: auth.user.email,
    sendEmail: (email) =>
      SystemServicesContainer().notificationService.sendSystemEmail(email),
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

const publicWebsiteUrl = (websiteUrl: string) => {
  try {
    const url = new URL(websiteUrl.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
    if (
      !url.hostname ||
      url.hostname === "undefined" ||
      url.hostname.endsWith(".undefined")
    ) {
      return undefined;
    }

    return url.origin;
  } catch {
    return undefined;
  }
};

const MAX_OPT_IN_PNG_BYTES = 5_000_000;
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const pngFileFromDataUrl = (dataUrl: string) => {
  const match = /^data:image\/png;base64,([A-Za-z0-9+/=\r\n]+)$/.exec(dataUrl);
  if (!match) return null;

  const buffer = Buffer.from(match[1].replace(/\s/g, ""), "base64");
  if (
    buffer.length < PNG_MAGIC.length ||
    buffer.length > MAX_OPT_IN_PNG_BYTES
  ) {
    return null;
  }
  if (!PNG_MAGIC.every((byte, index) => buffer[index] === byte)) return null;

  return new File([new Uint8Array(buffer)], "sms-opt-in.png", {
    type: "image/png",
  });
};

async function storeOptInImage(input: {
  services: Awaited<ReturnType<typeof getServicesContainer>>;
  memberId: string;
  websiteUrl: string;
  dataUrl?: string;
  logger: { warn: (data: unknown, message: string) => void };
}) {
  const base = publicWebsiteUrl(input.websiteUrl);
  const file = input.dataUrl ? pngFileFromDataUrl(input.dataUrl) : null;
  if (!file || !base) return undefined;

  try {
    const asset = await input.services.assetsService.createAsset(
      {
        filename: `sms-opt-in-${Date.now()}.png`,
        mimeType: "image/png",
        description: "SMS opt-in booking form",
      },
      file,
      memberEventSource(input.memberId),
    );
    return `${base}/assets/${asset.filename}`;
  } catch (error) {
    input.logger.warn({ error }, "SMS opt-in screenshot was not stored");
    return undefined;
  }
}
