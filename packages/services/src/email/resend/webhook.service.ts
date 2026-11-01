import { getLoggerFactory } from "@hacado/logger";
import { Resend } from "resend";
import { markCommunicationLogDeliveryFailed } from "../../communication-logs.service";
import { getResendConfiguration } from "./utils";

const deliveryFailureTypes = new Set([
  "email.bounced",
  "email.failed",
  "email.complained",
]);

const failureDetail = (event: { type: string; data: object }) => {
  if (event.type === "email.bounced" && "bounce" in event.data) {
    const bounce = event.data.bounce;
    if (bounce && typeof bounce === "object" && "message" in bounce) {
      const message = bounce.message;
      if (typeof message === "string" && message) {
        return message;
      }
    }
  }

  if (event.type === "email.failed" && "failed" in event.data) {
    const failed = event.data.failed;
    if (failed && typeof failed === "object" && "reason" in failed) {
      const reason = failed.reason;
      if (typeof reason === "string" && reason) {
        return reason;
      }
    }
  }

  if (event.type === "email.complained") {
    return "complaint";
  }

  return event.type;
};

export class ResendWebhookService {
  protected readonly loggerFactory = getLoggerFactory("ResendWebhookService");

  public async processWebhook(request: Request): Promise<Response> {
    const logger = this.loggerFactory("processWebhook");
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!secret) {
      logger.error("Resend webhook secret is not configured");
      return Response.json({ success: false }, { status: 500 });
    }

    const payload = await request.text();
    const id = request.headers.get("svix-id");
    const timestamp = request.headers.get("svix-timestamp");
    const signature = request.headers.get("svix-signature");
    if (!id || !timestamp || !signature) {
      return Response.json({ success: false }, { status: 400 });
    }

    let event: ReturnType<Resend["webhooks"]["verify"]>;
    try {
      event = new Resend(getResendConfiguration().apiKey).webhooks.verify({
        payload,
        headers: { id, timestamp, signature },
        webhookSecret: secret,
      });
    } catch (error) {
      logger.warn(
        { error: error instanceof Error ? error.message : "invalid signature" },
        "Rejected Resend webhook",
      );

      return Response.json({ success: false }, { status: 400 });
    }

    if (!deliveryFailureTypes.has(event.type) || !("email_id" in event.data)) {
      return Response.json({ success: true });
    }

    await markCommunicationLogDeliveryFailed({
      providerMessageId: event.data.email_id,
      reason: {
        key: "admin.communications.reason.deliveryFailed",
        args: { detail: failureDetail(event) },
      },
    });

    logger.info(
      { type: event.type, emailId: event.data.email_id },
      "Marked communication log failed from Resend",
    );

    return Response.json({ success: true });
  }
}
