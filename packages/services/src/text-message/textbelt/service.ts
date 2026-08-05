import { getLoggerFactory } from "@hacado/logger";
import {
  ITextMessageSender,
  TextMessage,
  TextMessageResponse,
} from "@hacado/types";
import { getAdminUrl, maskify } from "@hacado/utils";
import { TextBeltConfiguration } from "./types";

type SmsRequest = {
  phone: string;
  message: string;
  key: string;
  sender?: string;
  replyWebhookUrl?: string;
  webhookData?: string;
};

type SmsResponse = {
  success: boolean;
  quotaRemaining: number;
  textId?: string;
  error?: string;
};

export class TextBeltService implements ITextMessageSender {
  protected readonly loggerFactory = getLoggerFactory("TextBeltService");

  constructor(private readonly configuration: TextBeltConfiguration) {}

  public async sendTextMessage(
    organizationId: string,
    message: TextMessage,
  ): Promise<TextMessageResponse> {
    const logger = this.loggerFactory("sendTextMessage");
    logger.debug(
      {
        organizationId,
        phone: maskify(message.phone),
        sender: message.sender,
        messageLength: message.message.length,
        hasData: !!message.data,
      },
      "Sending text message via built-in TextBelt",
    );

    try {
      const url = getAdminUrl();

      const request: SmsRequest = {
        message: message.message,
        key: this.configuration.apiKey,
        phone: message.phone,
        sender: message.sender,
        replyWebhookUrl: `${url}/apps/textbelt/${organizationId}/webhook`,
        webhookData: message.data
          ? `${message.data.appId ?? ""}|${message.data.appointmentId ?? ""}|${message.data.customerId ?? ""}|${message.memberId ?? ""}|${message.data.data ?? ""}`
          : undefined,
      };

      logger.debug(
        {
          phone: maskify(message.phone),
          hasWebhookData: !!request.webhookData,
        },
        "Prepared TextBelt request, sending SMS",
      );

      const result = await fetch("https://textbelt.com/text", {
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      const response = (await result.json()) as SmsResponse;

      if (!response.success) {
        logger.error(
          {
            phone: maskify(message.phone),
            error: response.error,
          },
          "Failed to send SMS via TextBelt",
        );
        throw new Error(response.error || "Failed to send SMS");
      }

      logger.info(
        {
          phone: maskify(message.phone),
          textId: response.textId,
          quotaRemaining: response.quotaRemaining,
        },
        "Successfully sent SMS via TextBelt",
      );

      if (response.quotaRemaining < 100) {
        // TODO: Send low quota notification
        logger.warn(
          { quotaRemaining: response.quotaRemaining },
          "TextBelt quota is low",
        );
      }

      return {
        success: response.success,
        error: response.error,
        textId: response.textId,
      };
    } catch (e: any) {
      logger.error(
        {
          phone: maskify(message.phone),
          error: e?.message || e?.toString(),
        },
        "Error sending text message via TextBelt",
      );
      throw e;
    }
  }
}
