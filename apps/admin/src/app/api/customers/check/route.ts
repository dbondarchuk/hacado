import { getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/customers/check")("GET");
  const auth = await requirePermission("customer", "read", logger);
  if (!auth.ok) return auth.response;
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
      searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    },
    "Processing customer email and phone check request",
  );

  const searchParams = request.nextUrl.searchParams;
  const emails = searchParams.getAll("emails");
  const phones = searchParams.getAll("phones");
  const id = searchParams.get("id");

  if (emails.length === 0 && phones.length === 0) {
    logger.warn(
      { emails, phones },
      "Missing required emails or phones parameters",
    );
    return NextResponse.json(
      {
        success: false,
        error: "At least one email or phone is required",
        code: "missing_email_or_phone_parameter",
      },
      { status: 400 },
    );
  }

  logger.debug(
    {
      emails,
      phones,
      id,
    },
    "Checking customer email and phone uniqueness",
  );

  try {
    const isUnique =
      await servicesContainer.customersService.checkUniqueEmailAndPhone(
        emails,
        phones,
        id || undefined,
      );

    logger.debug(
      {
        emails,
        phones,
        id,
        isUnique,
      },
      "Customer email and phone uniqueness check completed",
    );

    return NextResponse.json(isUnique);
  } catch (error: any) {
    logger.error(
      {
        emails,
        phones,
        id,
        error: error?.message || error?.toString(),
      },
      "Failed to check customer email and phone uniqueness",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to check email and phone uniqueness",
        code: "check_email_phone_failed",
      },
      { status: 500 },
    );
  }
}
