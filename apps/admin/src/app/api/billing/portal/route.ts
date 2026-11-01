import { createPolarBillingPortalSession } from "@/app/api/billing/portal/billing-portal";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await createPolarBillingPortalSession();
  if (!result.ok) {
    const status = result.code === "unauthorized" ? 401 : 400;
    return NextResponse.json({ success: false, code: result.code }, { status });
  }

  return NextResponse.json({ success: true, url: result.url });
}
