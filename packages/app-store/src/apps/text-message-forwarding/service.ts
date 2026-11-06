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
} from "@hacado/types/apps";
import { getArguments } from "@hacado/utils/get-arguments";
import { subscriptionAllowsMultipleUsers } from "@hacado/utils/permissions";
import { template } from "@hacado/utils/string";
import { getAdminUrl, getWebsiteUrl } from "@hacado/utils/website";
import { getTextMessageForwardingMessages } from "./messages";
import {
  TextMessageForwardingConfiguration,
  textMessageForwardingConfigurationSchema,
} from "./models";
import {
  TextMessageForwardingAdminAllKeys,
  TextMessageForwardingAdminKeys,
  TextMessageForwardingAdminNamespace,
} from "./translations/types";

export default class TextMessageForwardingConnectedApp
  implements IConnectedApp, ITextMessageResponder
{
  protected readonly loggerFactory: LoggerFactory;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "TextMessageForwardingConnectedApp",
      props.organizationId,
    );
  }

  public async processRequest(
    appData: ConnectedAppData,
    request: TextMessageForwardingConfiguration,
  ): Promise<
    ConnectedAppStatusWithText<
      TextMessageForwardingAdminNamespace,
      TextMessageForwardingAdminKeys
    >
  > {
    const logger = this.loggerFactory("processRequest");
    const { data, success, error } =
      textMessageForwardingConfigurationSchema.safeParse(request);

    if (!success) {
      logger.error(
        { error },
        "Invalid Text Message Forwarding configuration request",
      );

      throw new ConnectedAppRequestError(
        "invalid_text-message-forwarding_configuration_request",
        { request, error },
        400,
        error.message,
      );
    }

    const organization =
      await this.props.services.organizationService.getOrganization();

    const allowsMultipleUsers = subscriptionAllowsMultipleUsers(
      organization?.availableUsers,
      organization?.feesExempt,
    );

    const savedData: TextMessageForwardingConfiguration = {
      ...data,
      defaultMemberId: allowsMultipleUsers ? data.defaultMemberId : undefined,
    };

    logger.debug(
      { appId: appData._id, defaultMemberId: savedData.defaultMemberId },
      "Processing text message forwarding configuration request",
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
            "invalid_text-message-forwarding_default_member",
            { request, defaultMemberId: savedData.defaultMemberId },
            400,
            "Default member not found",
          );
        }
      }

      const status: ConnectedAppStatusWithText<
        TextMessageForwardingAdminNamespace,
        TextMessageForwardingAdminKeys
      > = {
        status: "connected",
        statusText:
          "app_text-message-forwarding_admin.statusText.successfully_set_up",
      };

      this.props.update({
        data: savedData,
        ...status,
      });

      logger.info(
        { appId: appData._id, status: status.status },
        "Successfully configured text message forwarding",
      );

      return status;
    } catch (error: any) {
      logger.error(
        { appId: appData._id, error },
        "Error processing text message forwarding configuration",
      );

      const status: ConnectedAppStatusWithText<
        TextMessageForwardingAdminNamespace,
        TextMessageForwardingAdminKeys
      > = {
        status: "failed",
        statusText:
          "app_text-message-forwarding_admin.statusText.error_processing_configuration",
      };

      this.props.update({
        ...status,
      });

      return status;
    }
  }

  public async respond(
    appData: ConnectedAppData<TextMessageForwardingConfiguration>,
    textMessageReply: TextMessageReply,
  ): Promise<RespondResult<
    TextMessageForwardingAdminNamespace,
    TextMessageForwardingAdminKeys
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
      "Processing text message forwarding reply",
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
        organization?.feesExempt,
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
          "Processing reply from user - forwarding to customer",
        );

        const businessName = config.general.name?.trim();
        const body = businessName
          ? `${businessName}: ${reply.message}`
          : reply.message;

        this.props.services.notificationService.sendTextMessage({
          phone: textMessageReply.data.data,
          body,
          dontRequireConsent: true,
          webhookData: {
            ...reply.data,
            data: undefined,
          },
          appointmentId: reply.data.appointmentId,
          customerId: reply.data.customerId,
          participantType: "customer",
          memberId,
          handledBy:
            "app_text-message-forwarding_admin.handlers.resendToCustomer" satisfies TextMessageForwardingAdminAllKeys,
        });

        logger.info(
          { appId: appData._id, appointmentId: reply.data.appointmentId },
          "Successfully forwarded user reply to customer",
        );

        return {
          handledBy:
            "app_text-message-forwarding_admin.handlers.processUserReply" satisfies TextMessageForwardingAdminAllKeys,
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
        "Processing reply from customer - forwarding to user",
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
        getTextMessageForwardingMessages(config.brand.language)
          .resendToUserFromCustomer,
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
          "app_text-message-forwarding_admin.handlers.resendToUser" satisfies TextMessageForwardingAdminAllKeys,
      });

      logger.info(
        { appId: appData._id, appointmentId: reply.data.appointmentId },
        "Successfully forwarded customer reply to user",
      );

      return {
        handledBy:
          "app_text-message-forwarding_admin.handlers.processCustomerReply" satisfies TextMessageForwardingAdminAllKeys,
        participantType: "customer",
      };
    } catch (error: any) {
      logger.error(
        {
          appId: appData._id,
          appointmentId: textMessageReply.data?.appointmentId,
          error,
        },
        "Error processing text message forwarding reply",
      );

      this.props.update({
        status: "failed",
        statusText:
          "app_text-message-forwarding_admin.statusText.error_processing_reply" satisfies TextMessageForwardingAdminAllKeys,
      });

      throw error;
    }
  }
}
