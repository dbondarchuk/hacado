import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  ConnectedAppData,
  ConnectedAppError,
  ConnectedAppRequestError,
  ConnectedAppStatusWithText,
  IConnectedApp,
  IConnectedAppProps,
  ITextMessageResponder,
  RespondResult,
  TextMessageReply,
} from "@hacado/types/apps";
import { getArguments } from "@hacado/utils/get-arguments";
import {
  appendSharedPoolSuffix,
  isPlatformSmsCountry,
  isSmsEnabled,
} from "@hacado/utils/sms";
import { template, templateSafeWithError } from "@hacado/utils/string";
import { getAdminUrl, getWebsiteUrl } from "@hacado/utils/website";
import { getAutoReplySms } from "./messages";
import {
  TextMessageAutoReplyConfiguration,
  textMessageAutoReplyConfigurationSchema,
} from "./models";
import {
  TextMessageAutoReplyAdminAllKeys,
  TextMessageAutoReplyAdminKeys,
  TextMessageAutoReplyAdminNamespace,
} from "./translations/types";

export default class TextMessageAutoReplyConnectedApp
  implements IConnectedApp, ITextMessageResponder
{
  protected readonly loggerFactory: LoggerFactory;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "TextMessageAutoReplyConnectedApp",
      props.organizationId,
    );
  }

  public async processRequest(
    appData: ConnectedAppData,
    request: TextMessageAutoReplyConfiguration,
  ): Promise<ConnectedAppStatusWithText> {
    const logger = this.loggerFactory("processRequest");
    logger.debug(
      {
        appId: appData._id,
        autoReplyTemplateId: request.autoReplyTemplateId,
      },
      "Processing Text Message Auto Reply configuration request",
    );

    const {
      data: parsedData,
      success,
      error,
    } = textMessageAutoReplyConfigurationSchema.safeParse(request);
    if (!success) {
      logger.error(
        { error },
        "Invalid Text Message Auto Reply configuration request",
      );
      throw new ConnectedAppRequestError(
        "invalid_text-message-auto-reply_configuration_request",
        { request, error },
        400,
        error.message,
      );
    }

    const data = {
      ...parsedData,
      replyText: parsedData.replyText?.trim() || undefined,
    };

    try {
      if (data.autoReplyTemplateId) {
        const stored = await this.props.services.templatesService.getTemplate(
          data.autoReplyTemplateId,
        );

        if (!stored || stored.type !== "text-message") {
          throw new ConnectedAppError<
            TextMessageAutoReplyAdminNamespace,
            TextMessageAutoReplyAdminKeys
          >("app_text-message-auto-reply_admin.statusText.template_not_found");
        }
      }

      const status: ConnectedAppStatusWithText<
        TextMessageAutoReplyAdminNamespace,
        TextMessageAutoReplyAdminKeys
      > = {
        status: "connected",
        statusText:
          "app_text-message-auto-reply_admin.statusText.successfully_set_up",
      };

      this.props.update({
        data,
        ...status,
      });

      logger.info(
        { appId: appData._id, templateId: data.autoReplyTemplateId },
        "Successfully configured Text Message Auto Reply",
      );

      return status;
    } catch (e: any) {
      logger.error(
        {
          appId: appData._id,
          templateId: data.autoReplyTemplateId,
          error: e?.message || e?.toString(),
        },
        "Error processing Text Message Auto Reply configuration request",
      );

      const status: ConnectedAppStatusWithText = {
        status: "failed",
        statusText:
          e instanceof ConnectedAppError
            ? {
                key: e.key,
                args: e.args,
              }
            : ("app_text-message-auto-reply_admin.statusText.error_processing_configuration" satisfies TextMessageAutoReplyAdminAllKeys),
      };

      this.props.update({
        ...status,
      });

      return status;
    }
  }

  public async respond(
    appData: ConnectedAppData<TextMessageAutoReplyConfiguration>,
    textMessageReply: TextMessageReply,
  ): Promise<RespondResult | null> {
    const logger = this.loggerFactory("respond");
    logger.debug(
      {
        appId: appData._id,
        fromNumber: textMessageReply.from,
        messageLength: textMessageReply.message.length,
        hasAppointment: !!textMessageReply.appointment,
        hasCustomer: !!textMessageReply.customer,
        autoReplyTemplateId: appData.data?.autoReplyTemplateId,
      },
      "Processing text message auto reply",
    );

    try {
      const config =
        await this.props.services.configurationService.getConfigurations(
          "booking",
          "general",
          "brand",
          "social",
        );

      const { appointment, customer, ...reply } = textMessageReply;

      const organization =
        await this.props.services.organizationService.getOrganization();
      if (!organization) {
        logger.error(
          { appId: appData._id, appointmentId: appointment?._id },
          "Organization not found",
        );
        return null;
      }

      const adminUrl = getAdminUrl();
      const websiteUrl = getWebsiteUrl(organization);

      const memberId =
        textMessageReply.memberId ?? appointment?.memberId ?? appData.memberId;
      if (!memberId) {
        logger.warn(
          { appId: appData._id, memberId },
          "Member ID is required in text message reply",
        );
        return null;
      }

      const member =
        await this.props.services.teamService.getMemberById(memberId);
      if (!member) {
        logger.warn({ appId: appData._id, memberId }, "Member not found");
        return null;
      }

      const args = getArguments({
        appointment,
        config,
        customer,
        useAppointmentTimezone: true,
        additionalProperties: {
          reply,
        },
        locale: config.brand.language,
        adminUrl,
        websiteUrl,
        member,
      });

      if (isSmsEnabled(appData.data?.enabled)) {
        const replyText = appData.data?.replyText?.trim();
        const platformCountry = isPlatformSmsCountry(reply.from);
        const allowCustom = (
          await this.props.services.textMessageConfigurationService.getSmsMessagingAccess()
        ).allowCustomTemplates;

        let message: string | undefined;
        if (platformCountry && !allowCustom) {
          message = appendSharedPoolSuffix(
            template(getAutoReplySms(config.brand.language), args, true),
          );
        } else if (replyText && (!platformCountry || allowCustom)) {
          try {
            message = template(replyText, args, true);
          } catch (error) {
            logger.error(
              { appId: appData._id, error },
              "Auto reply text failed to render",
            );
            return null;
          }
        } else if (platformCountry) {
          message = template(
            getAutoReplySms(config.brand.language),
            args,
            true,
          );
        } else if (appData.data?.autoReplyTemplateId) {
          const autoReplyTemplate =
            await this.props.services.templatesService.getTemplate(
              appData.data.autoReplyTemplateId,
            );
          if (autoReplyTemplate?.type === "text-message") {
            message = templateSafeWithError(
              autoReplyTemplate.value as string,
              args,
              true,
            );
          }
        }

        if (message) {
          logger.debug(
            {
              appId: appData._id,
              messageLength: message.length,
              fromNumber: reply.from,
            },
            "Sending auto reply text message",
          );

          await this.props.services.notificationService.sendTextMessage({
            body: message,
            dontRequireConsent: true,
            handledBy:
              "app_text-message-auto-reply_admin.handler" satisfies TextMessageAutoReplyAdminAllKeys,
            phone: reply.from,
            participantType: "customer",
            appointmentId: reply.data?.appointmentId,
            customerId: reply.data?.customerId,
            sender: config.general.name,
            webhookData: reply.data,
            memberId,
          });

          logger.info(
            {
              appId: appData._id,
              fromNumber: reply.from,
            },
            "Successfully sent auto reply text message",
          );

          return {
            handledBy:
              "app_text-message-auto-reply_admin.handler" satisfies TextMessageAutoReplyAdminAllKeys,
            participantType: "customer",
          };
        } else {
          logger.error(
            {
              appId: appData._id,
              templateId: appData.data?.autoReplyTemplateId,
            },
            "Auto reply template not found",
          );

          this.props.update({
            status: "failed",
            statusText:
              "app_text-message-auto-reply_admin.statusText.template_not_found" satisfies TextMessageAutoReplyAdminAllKeys,
          });
        }
      } else {
        logger.warn(
          { appId: appData._id },
          "No auto reply template configured",
        );

        this.props.update({
          status: "failed",
          statusText:
            "app_text-message-auto-reply_admin.statusText.template_not_found" satisfies TextMessageAutoReplyAdminAllKeys,
        });
      }

      return null;
    } catch (error: any) {
      logger.error(
        {
          appId: appData._id,
          fromNumber: textMessageReply.from,
          error: error?.message || error?.toString(),
        },
        "Error processing text message auto reply",
      );
      throw error;
    }
  }
}
