import { getLoggerFactory } from "@hacado/logger";
import { ApiRequest, ApiResponse } from "@hacado/types/apps";
import {
  IBillingService,
  IBookingService,
  ICommunicationLogsService,
  IConfigurationService,
  IConnectedAppsService,
  ICustomersService,
  IEventService,
  INotificationService,
  IOrganizationService,
  ITeamService,
} from "@hacado/types/services";
import { normalizeToE164 } from "@hacado/utils/phone";
import { maskify } from "@hacado/utils/string";
import crypto from "crypto";
import { InboundTextMessageService } from "../inbound-reply.service";
import { SmsConsentService } from "../sms-consent.service";
import { TextBeltService } from "./service";
import { TextBeltConfiguration } from "./types";

type TextbeltWebhookData = {
  textId: string;
  fromNumber: string;
  text: string;
  data?: string;
};

const verifyWebhook = (
  apiKey: string,
  timestamp: string,
  requestSignature: string,
  requestPayload: string,
): boolean => {
  const mySignature = crypto
    .createHmac("sha256", apiKey)
    .update(timestamp + requestPayload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(requestSignature),
    Buffer.from(mySignature),
  );
};

export class TextBeltWebhookService {
  protected readonly loggerFactory = getLoggerFactory("TextBeltWebhookService");

  constructor(
    private readonly organizationId: string,
    private readonly configuration: TextBeltConfiguration,
    private readonly configurationService: IConfigurationService,
    private readonly connectedAppsService: IConnectedAppsService,
    private readonly bookingService: IBookingService,
    private readonly customersService: ICustomersService,
    private readonly communicationLogsService: ICommunicationLogsService,
    private readonly notificationService: INotificationService,
    private readonly organizationService: IOrganizationService,
    private readonly billingService: IBillingService,
    private readonly eventService: IEventService,
    private readonly teamService: ITeamService,
  ) {}

  private inboundService() {
    return new InboundTextMessageService(
      this.organizationId,
      this.configurationService,
      this.connectedAppsService,
      this.bookingService,
      this.customersService,
      this.communicationLogsService,
      this.notificationService,
      this.organizationService,
      this.teamService,
    );
  }

  public async processWebhook(request: ApiRequest): Promise<ApiResponse> {
    const logger = this.loggerFactory("processWebhook");
    logger.debug(
      { organizationId: this.organizationId },
      "Processing TextBelt webhook",
    );

    try {
      const bodyText = await request.text();
      const timestamp = request.headers.get("X-textbelt-timestamp");
      const signature = request.headers.get("X-textbelt-signature");

      logger.debug(
        {
          hasTimestamp: !!timestamp,
          hasSignature: !!signature,
        },
        "Extracted webhook headers",
      );

      if (!timestamp || !signature) {
        logger.warn({ bodyText }, "Malformed headers in SMS webhook");
        return Response.json({ success: false }, { status: 400 });
      }

      if (
        !verifyWebhook(
          this.configuration.apiKey,
          timestamp,
          signature,
          bodyText,
        )
      ) {
        logger.warn({ bodyText }, "Unverified SMS webhook");
        return Response.json({ success: false }, { status: 400 });
      }

      logger.debug("Webhook signature verified successfully");

      const reply = JSON.parse(bodyText) as TextbeltWebhookData;
      if (!reply.fromNumber) {
        logger.warn({ bodyText }, "Malformed body in SMS webhook");
        return Response.json({ success: false }, { status: 400 });
      }

      logger.info(
        {
          fromNumber: maskify(reply.fromNumber),
          textId: reply.textId,
          hasData: !!reply.data,
        },
        "Received TextBelt reply webhook",
      );

      const brand = await this.configurationService.getConfiguration("brand");
      const keywordReply = await new SmsConsentService(
        this.organizationId,
      ).handleInboundSmsKeyword(reply.fromNumber, reply.text, brand.language);

      if (keywordReply) {
        const phone = normalizeToE164(reply.fromNumber) ?? reply.fromNumber;
        await new TextBeltService(this.configuration).sendTextMessage(
          { phone, message: keywordReply },
          this.organizationId,
        );

        logger.info(
          { fromNumber: maskify(reply.fromNumber) },
          "Handled inbound SMS keyword",
        );

        return Response.json({ success: true }, { status: 201 });
      }

      await this.billingService.consumeSmsCredits({
        amount: 1,
        direction: "inbound",
        textId: reply.textId,
      });

      const parts = (reply?.data || "").split("|", 4);

      const appId = parts[0] || undefined;
      const appointmentId = parts[1] || undefined;
      const customerId = parts[2] || undefined;
      const data = parts[3] || undefined;

      logger.debug(
        {
          parsedAppId: appId,
          appointmentId,
          customerId,
          hasData: !!data,
        },
        "Parsed webhook data",
      );

      logger.debug(
        { fromNumber: maskify(reply.fromNumber) },
        "Processing text message reply",
      );

      await this.inboundService().handle({
        from: reply.fromNumber,
        message: reply.text,
        messageId: reply.textId,
        data: {
          appId,
          data,
          appointmentId,
          customerId,
        },
        appointmentId,
        customerId,
      });

      logger.info(
        { fromNumber: maskify(reply.fromNumber) },
        "Successfully processed TextBelt webhook",
      );

      return Response.json({ success: true }, { status: 201 });
    } catch (error: any) {
      logger.error(
        { error: error?.message || error?.toString() },
        "Error processing TextBelt webhook",
      );

      throw error;
    }
  }
}
