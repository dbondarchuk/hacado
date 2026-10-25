import { getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { customerConsentPhone } from "@/lib/customer-sms-consent";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const customerResponse = async (id: string) => {
  const services = await getServicesContainer();
  const customer = await services.customersService.getCustomer(id);
  return { services, customer };
};

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/customers/[id]/sms-consent">,
) {
  const logger = getLoggerFactory("AdminAPI/customers/[id]/sms-consent")("GET");
  const auth = await requirePermission("customer", "read", logger);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const { services, customer } = await customerResponse(id);
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

  const phone = customerConsentPhone(
    customer,
    request.nextUrl.searchParams.get("phone"),
  );

  if (!phone) {
    return NextResponse.json(
      {
        success: false,
        error: "Phone does not belong to this customer",
        code: "phone_not_found",
      },
      { status: 400 },
    );
  }

  const status =
    await services.smsConsentService.getCustomerSmsConsentStatus(phone);

  return NextResponse.json(status);
}

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
  const { services, customer } = await customerResponse(id);
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

  const json = await request.json().catch(() => null);
  const requestedPhone = typeof json?.phone === "string" ? json.phone : null;
  const phone = customerConsentPhone(customer, requestedPhone);
  if (!phone) {
    return NextResponse.json(
      {
        success: false,
        error: "Phone does not belong to this customer",
        code: "phone_not_found",
      },
      { status: 400 },
    );
  }

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
