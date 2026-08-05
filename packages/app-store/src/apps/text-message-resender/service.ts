import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  ConnectedAppData,
  ConnectedAppRequestError,
  ConnectedAppStatusWithText,
  IConnectedApp,
  IConnectedAppProps,
  ITextMessageResponder,
  RespondResult,
  TextMessageReply,
} from "@hacado/types";
import {
  getAdminUrl,
  getArguments,
  getWebsiteUrl,
  subscriptionAllowsMultipleUsers,
  template,
} from "@hacado/utils";
import { TextMessageResenderMessages } from "./messages";
import {
  TextMessageResenderConfiguration,
  textMessageResenderConfigurationSchema,
} from "./models";
import {
  TextMessageResenderAdminAllKeys,
  TextMessageResenderAdminKeys,
  TextMessageResenderAdminNamespace,
} from "./translations/types";

export default class TextMessageResenderConnectedApp
  implements IConnectedApp, ITextMessageResponder
{
  protected readonly loggerFactory: LoggerFactory;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "TextMessageResenderConnectedApp",
      props.organizationId,
    );
  }

  public async processRequest(
    appData: ConnectedAppData,
    request: TextMessageResenderConfiguration,
  ): Promise<
    ConnectedAppStatusWithText<
      TextMessageResenderAdminNamespace,
      TextMessageResenderAdminKeys
    >
  > {
    const logger = this.loggerFactory("processRequest");
    const { data, success, error } =
      textMessageResenderConfigurationSchema.safeParse(request);
    if (!success) {
      logger.error(
        { error },
        "Invalid Text Message Resender configuration request",
      );
      throw new ConnectedAppRequestError(
        "invalid_text-message-resender_configuration_request",
        { request, error },
        400,
        error.message,
      );
    }

    const organization =
      await this.props.services.organizationService.getOrganization();
    const allowsMultipleUsers = subscriptionAllowsMultipleUsers(
      organization?.availableUsers,
    );
    const savedData: TextMessageResenderConfiguration = {
      ...data,
      defaultMemberId: allowsMultipleUsers
        ? data.defaultMemberId
        : undefined,
    };

    logger.debug(
      { appId: appData._id, defaultMemberId: savedData.defaultMemberId },
      "Processing text message resender configuration request",
    );

    try {
      if (savedData.defaultMemberId) {
        const member = await this.props.services.teamService.getMemberById(
          savedData.defaultMemberId,
        );
        if (!member) {
          logger.error(
            {
              appId: appData._id,
              defaultMemberId: savedData.defaultMemberId,
            },
            "Default member not found",
          );
          throw new ConnectedAppRequestError(
            "invalid_text-message-resender_default_member",
            { request, defaultMemberId: savedData.defaultMemberId },
            400,
            "Default member not found",
          );
        }
      }

      const status: ConnectedAppStatusWithText<
        TextMessageResenderAdminNamespace,
        TextMessageResenderAdminKeys
      > = {
        status: "connected",
        statusText:
          "app_text-message-resender_admin.statusText.successfully_set_up",
      };

      this.props.update({
        data: savedData,
        ...status,
      });

      logger.info(
        { appId: appData._id, status: status.status },
        "Successfully configured text message resender",
      );

      return status;
    } catch (error: any) {
      logger.error(
        { appId: appData._id, error },
        "Error processing text message resender configuration",
      );

      const status: ConnectedAppStatusWithText<
        TextMessageResenderAdminNamespace,
        TextMessageResenderAdminKeys
      > = {
        status: "failed",
        statusText:
          "app_text-message-resender_admin.statusText.error_processing_configuration",
      };

      this.props.update({
        ...status,
      });

      return status;
    }
  }

  public async respond(
    appData: ConnectedAppData<TextMessageResenderConfiguration>,
    textMessageReply: TextMessageReply,
  ): Promise<RespondResult<
    TextMessageResenderAdminNamespace,
    TextMessageResenderAdminKeys
  > | null> {
    const logger = this.loggerFactory("respond");
    logger.debug(
      {
        appId: appData._id,
        appointmentId: textMessageReply.data?.appointmentId,
        from: textMessageReply.from?.replace(/(\d{3})\d{3}(\d{4})/, "$1***$2"),
        message: textMessageReply.message,
        hasData: !!textMessageReply.data.data?.length,
      },
      "Processing text message resender reply",
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
      const allowsMultipleUsers = subscriptionAllowsMultipleUsers(
        organization?.availableUsers,
      );
      const memberId =
        textMessageReply.memberId ??
        (allowsMultipleUsers ? appData.data?.defaultMemberId : undefined) ??
        appData.memberId;
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
        logger.error(
          { appId: appData._id, appointmentId: reply.data.appointmentId },
          "Member not found",
        );

        throw new Error("Member not found");
      }

      if (textMessageReply.data.data?.length) {
        logger.info(
          {
            appId: appData._id,
            appointmentId: reply.data.appointmentId,
            from: reply.from?.replace(/(\d{3})\d{3}(\d{4})/, "$1***$2"),
            targetPhone: textMessageReply.data.data.replace(
              /(\d{3})\d{3}(\d{4})/,
              "$1***$2",
            ),
          },
          "Processing reply from user - resending to customer",
        );

        this.props.services.notificationService.sendTextMessage({
          phone: textMessageReply.data.data,
          body: reply.message,
          webhookData: {
            ...reply.data,
            data: undefined,
          },
          appointmentId: reply.data.appointmentId,
          customerId: reply.data.customerId,
          participantType: "customer",
          memberId,
          handledBy:
            "app_text-message-resender_admin.handlers.resendToCustomer" satisfies TextMessageResenderAdminAllKeys,
        });

        logger.info(
          { appId: appData._id, appointmentId: reply.data.appointmentId },
          "Successfully resent user reply to customer",
        );

        return {
          handledBy:
            "app_text-message-resender_admin.handlers.processUserReply" satisfies TextMessageResenderAdminAllKeys,
          participantType: "member",
        };
      }

      logger.info(
        {
          appId: appData._id,
          appointmentId: reply.data.appointmentId,
          from: reply.from?.replace(/(\d{3})\d{3}(\d{4})/, "$1***$2"),
          customerName: customer?.name,
        },
        "Processing reply from customer - resending to user",
      );

      if (!organization) {
        logger.error(
          { appointmentId: reply.data.appointmentId },
          "Organization not found",
        );
        throw new Error("Organization not found");
      }

      const adminUrl = getAdminUrl();
      const websiteUrl = getWebsiteUrl(organization);
      const args = getArguments({
        appointment,
        config,
        customer,
        locale: config.brand.language,
        additionalProperties: {
          reply,
        },
        adminUrl,
        websiteUrl,
        user: member,
        member,
      });

      const body = template(
        TextMessageResenderMessages[config.brand.language]
          .resendToUserFromCustomer ??
          TextMessageResenderMessages["en"].resendToUserFromCustomer,
        args,
      );

      const phone = member.phone || config.general.phone;
      if (!phone) {
        logger.warn(
          {
            appId: appData._id,
            appointmentId: reply.data.appointmentId,
            memberId,
          },
          "Phone field not found for member notification",
        );

        return null;
      }

      logger.debug(
        {
          appId: appData._id,
          appointmentId: reply.data.appointmentId,
          phone: phone.replace(/(\d{3})\d{3}(\d{4})/, "$1***$2"),
          messageLength: body.length,
        },
        "Sending customer reply to user",
      );

      this.props.services.notificationService.sendTextMessage({
        phone,
        body,
        webhookData: {
          ...reply.data,
          data: reply.from,
        },
        appointmentId: reply.data.appointmentId,
        customerId: reply.data.customerId,
        participantType: "member",
        memberId,
        handledBy:
          "app_text-message-resender_admin.handlers.resendToUser" satisfies TextMessageResenderAdminAllKeys,
      });

      logger.info(
        { appId: appData._id, appointmentId: reply.data.appointmentId },
        "Successfully resent customer reply to user",
      );

      return {
        handledBy:
          "app_text-message-resender_admin.handlers.processCustomerReply" satisfies TextMessageResenderAdminAllKeys,
        participantType: "customer",
      };
    } catch (error: any) {
      logger.error(
        {
          appId: appData._id,
          appointmentId: textMessageReply.data?.appointmentId,
          error,
        },
        "Error processing text message resender reply",
      );

      this.props.update({
        status: "failed",
        statusText:
          "app_text-message-resender_admin.statusText.error_processing_reply" satisfies TextMessageResenderAdminAllKeys,
      });

      throw error;
    }
  }
}
