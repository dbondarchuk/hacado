import { getLoggerFactory } from "@hacado/logger";
import { ITextMessageSender } from "@hacado/types";
import { maskify, normalizeToE164 } from "@hacado/utils";
import { Telnyx } from "telnyx";
import { SMS_OPT_IN_KEYWORDS, SMS_OPT_OUT_KEYWORDS } from "../compliance";
import { InboundTextMessageService } from "../inbound-reply.service";
import { getHelpSms } from "../messages";
import { SmsStore } from "../sms-store";
import { getTelnyxConfiguration } from "./config";
import { TelnyxService } from "./service";

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

const keyword = (value: string | null | undefined) =>
  (value ?? "").trim().toUpperCase();

const isKeyword = (value: string, list: readonly string[]) =>
  list.includes(value);

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
  ) {}

  public async processWebhook(request: Request): Promise<Response> {
    const logger = this.loggerFactory("processWebhook");
    const bodyText = await request.text();
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const config = getTelnyxConfiguration();
    if (!config.publicKey) {
      logger.error("TELNYX_PUBLIC_KEY is not configured");
      return Response.json({ success: false }, { status: 500 });
    }

    let event: TelnyxMessagingEvent;
    try {
      const client = new Telnyx({
        apiKey: config.apiKey || "webhook",
        publicKey: config.publicKey,
      });

      event = (await client.webhooks.unwrap(bodyText, {
        headers,
      })) as TelnyxMessagingEvent;
    } catch (error) {
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
    const autoResponse = keyword(payload?.autoresponse_type);
    const command = keyword(text);
    logger.info(
      { fromNumber: maskify(phone), autoResponse: autoResponse || undefined },
      "Received inbound SMS",
    );

    if (
      isKeyword(command, SMS_OPT_OUT_KEYWORDS) ||
      isKeyword(autoResponse, SMS_OPT_OUT_KEYWORDS)
    ) {
      await this.smsStore.optOut(phone, "stop");
      return;
    }

    if (
      isKeyword(command, SMS_OPT_IN_KEYWORDS) ||
      isKeyword(autoResponse, SMS_OPT_IN_KEYWORDS)
    ) {
      if (await this.smsStore.hasAnyConsent(phone)) {
        await this.smsStore.clearOptOut(phone);
      }

      return;
    }

    if (command === "HELP" || autoResponse === "HELP") {
      if (autoResponse) {
        return;
      }

      await this.sender.sendTextMessage({
        phone,
        message: getHelpSms("en"),
      });
      return;
    }

    const send = await this.smsStore.findLatestSendByPhone(phone);
    if (!send) {
      return;
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
