import { getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { getLoggerFactory } from "@hacado/logger";
import { normalizeToE164 } from "@hacado/utils";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/customers/[id]/sms-consent">,
) {
  const logger = getLoggerFactory("AdminAPI/customers/[id]/sms-consent")(
    "POST",
  );

  const auth = await requirePermission("customer", "update", logger);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const services = await getServicesContainer();
  const customer = await services.customersService.getCustomer(id);
  if (!customer) {
    return NextResponse.json(
      {
        success: false,
        error: "Customer not found",
        code: "customer_not_found",
      },
      { status: 404 },
    );
  }

  const phone = customer.phone ? normalizeToE164(customer.phone) : null;
  if (!phone) {
    return NextResponse.json(
      {
        success: false,
        error: "Customer has no phone",
        code: "phone_required",
      },
      { status: 400 },
    );
  }

  const json = await request.json().catch(() => null);
  const consented = json?.consented === true;
  const forwardedFor = request.headers.get("x-forwarded-for");

  await services.smsConsentService.recordCustomerSmsConsent({
    phone,
    consented,
    source: "owner_attested",
    ip: forwardedFor?.split(",")[0]?.trim() || undefined,
  });

  const status =
    await services.smsConsentService.getCustomerSmsConsentStatus(phone);

  logger.info(
    { customerId: id, consented: status.consented },
    "SMS consent updated",
  );
  return NextResponse.json(status);
}
