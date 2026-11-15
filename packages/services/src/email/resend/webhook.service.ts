import { getLoggerFactory } from "@hacado/logger";
import { COMMUNICATION_FAILED_EVENT_TYPE } from "@hacado/types/events";
import { Resend } from "resend";
import {
  markCommunicationLogDeliveryFailed,
  type CommunicationLogDeliveryFailedResult,
} from "../../communication-logs.service";
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

type EmitCommunicationFailed = (
  organizationId: string,
  type: typeof COMMUNICATION_FAILED_EVENT_TYPE,
  payload: {
    logId: string;
    channel: CommunicationLogDeliveryFailedResult["channel"];
    participant: string;
    memberId?: string;
    appointmentId?: string;
    customerId?: string;
    reason?: string;
    cause: "delivery";
  },
) => Promise<void>;

export class ResendWebhookService {
  protected readonly loggerFactory = getLoggerFactory("ResendWebhookService");

  constructor(
    private readonly emitCommunicationFailedEvent?: EmitCommunicationFailed,
  ) {}

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

    const detail = failureDetail(event);
    const affected = await markCommunicationLogDeliveryFailed({
      providerMessageId: event.data.email_id,
      reason: {
        key: "admin.communications.reason.deliveryFailed",
        args: { detail },
      },
    });

    if (this.emitCommunicationFailedEvent) {
      await Promise.all(
        affected.map((log) =>
          this.emitCommunicationFailedEvent!(
            log.organizationId,
            COMMUNICATION_FAILED_EVENT_TYPE,
            {
              logId: log.logId,
              channel: log.channel,
              participant: log.participant,
              memberId: log.memberId,
              appointmentId: log.appointmentId,
              customerId: log.customerId,
              reason: detail,
              cause: "delivery",
            },
          ),
        ),
      );
    }

    logger.info(
      {
        type: event.type,
        emailId: event.data.email_id,
        count: affected.length,
      },
      "Marked communication log failed from Resend",
    );

    return Response.json({ success: true });
  }
}
