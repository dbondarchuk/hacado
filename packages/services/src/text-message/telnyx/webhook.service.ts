import { getLoggerFactory } from "@hacado/logger";
import { ITextMessageSender } from "@hacado/types";
import { maskify, normalizeToE164 } from "@hacado/utils";
import { markCommunicationLogDeliveryFailed } from "../../communication-logs.service";
import { classifyInboundSmsKeyword } from "../compliance";
import { InboundTextMessageService } from "../inbound-reply.service";
import { getInboundSmsKeywordReply } from "../messages";
import { SmsRegistrationStore } from "../registration-store";
import { SmsStore } from "../sms-store";
import { TelnyxService } from "./service";
import { TelnyxWebhookConfigError, unwrapTelnyxWebhook } from "./verify";

type TelnyxMessagingEvent = {
  data?: {
    event_type?: string;
    payload?: {
      id?: string;
      text?: string;
      autoresponse_type?: string | null;
      from?: { phone_number?: string };
      to?: Array<{ phone_number?: string; status?: string }>;
      errors?: Array<{ code?: string }>;
    };
  };
};

export class TelnyxMessagingWebhookService {
  protected readonly loggerFactory = getLoggerFactory(
    "TelnyxMessagingWebhookService",
  );

  constructor(
    private readonly smsStore: SmsStore = new SmsStore(),
    private readonly sender: ITextMessageSender = new TelnyxService(),
    private readonly inboundForOrganization: (
      organizationId: string,
    ) => InboundTextMessageService = () => {
      throw new Error("Inbound text handler is not configured");
    },
    private readonly registrationStore = new SmsRegistrationStore(),
  ) {}

  public async processWebhook(request: Request): Promise<Response> {
    const logger = this.loggerFactory("processWebhook");
    const bodyText = await request.text();

    let event: TelnyxMessagingEvent;
    try {
      event = await unwrapTelnyxWebhook<TelnyxMessagingEvent>(
        bodyText,
        request.headers,
      );
    } catch (error) {
      if (error instanceof TelnyxWebhookConfigError) {
        return Response.json({ success: false }, { status: 500 });
      }

      logger.warn(
        { error: error instanceof Error ? error.message : "invalid signature" },
        "Rejected Telnyx webhook",
      );
      return Response.json({ success: false }, { status: 400 });
    }

    const eventType = event.data?.event_type;
    const payload = event.data?.payload;
    logger.info({ eventType }, "Received Telnyx messaging webhook");

    if (eventType === "message.finalized") {
      await this.handleFinalized(payload);
      return Response.json({ success: true });
    }

    if (eventType === "message.received") {
      await this.handleReceived(payload);
      return Response.json({ success: true });
    }

    return Response.json({ success: true });
  }

  private async handleFinalized(
    payload: NonNullable<TelnyxMessagingEvent["data"]>["payload"] | undefined,
  ) {
    const textId = payload?.id;
    if (!textId) {
      return;
    }

    const errorCode = payload?.errors?.[0]?.code;
    const status = payload?.to?.[0]?.status;
    const failed =
      status === "delivery_failed" ||
      status === "sending_failed" ||
      Boolean(errorCode);

    await this.smsStore.updateStatusByTextId(
      textId,
      failed ? "failed" : "delivered",
      errorCode,
    );

    if (failed) {
      const detail = errorCode || status || "delivery failed";
      await markCommunicationLogDeliveryFailed({
        providerMessageId: textId,
        reason: {
          key: "admin.communications.reason.deliveryFailed",
          args: { detail },
        },
      });
    }

    if (errorCode === "40300") {
      const phone = normalizeToE164(payload?.to?.[0]?.phone_number ?? "");
      if (phone) {
        await this.smsStore.optOut(phone, "telnyx_40300");
      }
    }
  }

  private async handleReceived(
    payload: NonNullable<TelnyxMessagingEvent["data"]>["payload"] | undefined,
  ) {
    const logger = this.loggerFactory("handleReceived");
    const phone = normalizeToE164(payload?.from?.phone_number ?? "");
    if (!phone) {
      return;
    }

    const text = payload?.text ?? "";
    const command = classifyInboundSmsKeyword(text);
    const autoResponse = classifyInboundSmsKeyword(payload?.autoresponse_type);
    const handled = command ?? autoResponse;
    logger.info(
      { fromNumber: maskify(phone), autoResponse: autoResponse || undefined },
      "Received inbound SMS",
    );

    if (handled) {
      if (handled === "stop") {
        await this.smsStore.optOut(phone, "stop");
      } else if (handled === "start") {
        await this.smsStore.clearOptOut(phone);
      }

      if (!autoResponse) {
        await this.sender.sendTextMessage({
          phone,
          message: getInboundSmsKeywordReply(handled, "en"),
        });
      }

      return;
    }

    const send = await this.smsStore.findLatestSendByPhone(phone);
    if (!send) {
      return;
    }

    const destination = normalizeToE164(payload?.to?.[0]?.phone_number ?? "");
    if (destination) {
      const profile =
        await this.registrationStore.getProfileNumber(destination);

      if (
        profile &&
        (profile.status !== "assigned" ||
          profile.organizationId !== send.organizationId)
      ) {
        return;
      }
    }

    await this.inboundForOrganization(send.organizationId).handle({
      from: phone,
      message: text,
      messageId: payload?.id,
      data: {
        appId: send.appId,
        appointmentId: send.appointmentId,
        customerId: send.customerId,
        data: send.data,
      },
      appointmentId: send.appointmentId,
      customerId: send.customerId,
    });
  }
}
