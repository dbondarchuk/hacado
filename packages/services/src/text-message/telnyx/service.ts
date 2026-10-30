import { getLoggerFactory } from "@hacado/logger";
import {
  ITextMessageSender,
  TextMessage,
  TextMessageResponse,
} from "@hacado/types/apps";
import { maskify } from "@hacado/utils";
import { appendStopFooter } from "../compliance";
import { SmsTransientError } from "../errors";
import { countSmsSegments } from "../segments";
import { getTelnyxConfiguration, TelnyxConfiguration } from "./config";
import { resolveSender } from "./sender";

type TelnyxError = {
  code?: string;
  title?: string;
  detail?: string;
};

type TelnyxMessageResponse = {
  data?: { id?: string };
  errors?: TelnyxError[];
};

const isTransientStatus = (status: number) => status === 429 || status >= 500;

export class TelnyxService implements ITextMessageSender {
  protected readonly loggerFactory = getLoggerFactory("TelnyxService");

  constructor(
    private readonly configuration: TelnyxConfiguration = getTelnyxConfiguration(),
  ) {}

  public async sendTextMessage(
    message: TextMessage,
    organizationId?: string,
    override?: { from?: string; messagingProfileId?: string },
  ): Promise<TextMessageResponse> {
    const logger = this.loggerFactory("sendTextMessage");
    const sender = resolveSender(message.phone, this.configuration, override);
    if ("skipped" in sender) {
      logger.info(
        { organizationId, phone: maskify(message.phone) },
        sender.reason,
      );
      return { success: true, skipped: true, error: sender.reason };
    }

    if (!this.configuration.apiKey || !sender.from) {
      logger.error({ organizationId }, "Telnyx configuration is missing");
      return {
        success: false,
        error: "Telnyx configuration is missing",
        retryable: false,
      };
    }

    const text = appendStopFooter(message.message);
    logger.debug(
      {
        organizationId,
        phone: maskify(message.phone),
        segments: countSmsSegments(text),
      },
      "Sending text message via Telnyx",
    );

    let response: Response;
    try {
      response = await fetch("https://api.telnyx.com/v2/messages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.configuration.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: sender.from,
          to: message.phone,
          text,
          messaging_profile_id: sender.messagingProfileId || undefined,
          type: "SMS",
        }),
      });
    } catch (error) {
      logger.error(
        {
          organizationId,
          error: error instanceof Error ? error.message : "network",
        },
        "Telnyx request failed",
      );
      throw new SmsTransientError("Telnyx request failed");
    }

    const payload = (await response
      .json()
      .catch(() => ({}))) as TelnyxMessageResponse;
    const telnyxError = payload.errors?.[0];
    const errorCode = telnyxError?.code;

    if (!response.ok || errorCode) {
      logger.error(
        {
          organizationId,
          status: response.status,
          errorCode,
        },
        "Telnyx rejected the message",
      );

      if (isTransientStatus(response.status)) {
        throw new SmsTransientError(
          telnyxError?.detail || "Telnyx temporary error",
        );
      }

      return {
        success: false,
        error:
          telnyxError?.detail ||
          telnyxError?.title ||
          "Telnyx rejected the message",
        errorCode,
        retryable: false,
      };
    }

    return {
      success: true,
      textId: payload.data?.id,
    };
  }
}
