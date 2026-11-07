import { getServicesContainer, getSession } from "@/app/utils";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  endpoint: z.string().url(),
});

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/push/test")("POST");
  logger.debug("Sending test push notification");

  const session = await getSession();
  if (!session) {
    logger.debug("Unauthorized push test request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberId = session.user.memberId;
  if (!memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    logger.warn({ error: parsed.error }, "Invalid push test request");
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const services = await getServicesContainer();
  const subscription =
    await services.pushNotificationsService.getSubscriptionByEndpoint(
      parsed.data.endpoint,
    );

  if (!subscription || subscription.memberId !== memberId) {
    logger.warn(
      { endpoint: parsed.data.endpoint, memberId },
      "Push test subscription not found for member",
    );

    return NextResponse.json(
      { error: "Push subscription not found" },
      { status: 404 },
    );
  }

  const t = await getI18nAsync("admin");

  try {
    await services.notificationService.sendPush({
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      expirationTime: subscription.expirationTime ?? null,
      memberId: subscription.memberId,
      payload: {
        title: t("users.profile.push.testTitle"),
        body: t("users.profile.push.testBody"),
        url: "/dashboard",
        tag: "hacado-push-test",
      },
    });

    logger.info(
      { endpoint: subscription.endpoint, memberId },
      "Test push notification enqueued",
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error(
      { error, endpoint: subscription.endpoint, memberId },
      "Failed to enqueue test push notification",
    );

    return NextResponse.json(
      { error: "Failed to send test notification" },
      { status: 500 },
    );
  }
}
