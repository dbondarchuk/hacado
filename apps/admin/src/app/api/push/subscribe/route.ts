import {
  getOrganizationId,
  getServicesContainer,
  getSession,
} from "@/app/utils";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/push/subscribe")("POST");
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = subscriptionSchema.safeParse(await request.json());
  if (!parsed.success) {
    logger.warn({ error: parsed.error }, "Invalid push subscription");
    return NextResponse.json(
      { error: "Invalid subscription", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const organizationId = await getOrganizationId();
  const memberId = session.user.memberId;

  if (!organizationId || !memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const services = await getServicesContainer();
  const record = await services.pushNotificationsService.upsertSubscription({
    organizationId,
    memberId,
    userId: session.user.id,
    endpoint: parsed.data.endpoint,
    keys: parsed.data.keys,
    expirationTime: parsed.data.expirationTime ?? null,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  logger.info(
    { memberId, endpoint: record.endpoint },
    "Push subscription saved",
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/push/subscribe")("DELETE");
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const endpoint =
    typeof body?.endpoint === "string"
      ? body.endpoint
      : request.nextUrl.searchParams.get("endpoint");

  if (!endpoint) {
    return NextResponse.json({ error: "endpoint required" }, { status: 400 });
  }

  const services = await getServicesContainer();
  const existing =
    await services.pushNotificationsService.getSubscriptionByEndpoint(endpoint);

  if (existing && existing.memberId !== session.user.memberId) {
    logger.warn(
      { endpoint, memberId: session.user.memberId },
      "Push subscription ownership mismatch",
    );

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await services.pushNotificationsService.deleteSubscriptionByEndpoint(
    endpoint,
  );

  logger.info({ endpoint }, "Push subscription deleted");
  return NextResponse.json({ ok: true });
}
