import { getServicesContainer } from "@/utils/utils";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get("phone") ?? "";
  const services = await getServicesContainer();
  const consented =
    await services.notificationService.hasActiveCustomerSmsConsent(phone);

  return NextResponse.json({ consented });
}
