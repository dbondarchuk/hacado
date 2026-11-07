import { getServicesContainer, getSession } from "@/app/utils";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const endpoint = request.nextUrl.searchParams.get("endpoint");
  if (!endpoint) {
    return NextResponse.json({ error: "endpoint required" }, { status: 400 });
  }

  const services = await getServicesContainer();
  const subscription =
    await services.pushNotificationsService.getSubscriptionByEndpoint(endpoint);

  const enabled =
    !!subscription && subscription.memberId === session.user.memberId;

  return NextResponse.json({ enabled });
}
