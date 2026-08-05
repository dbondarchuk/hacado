import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  ConnectedAppData,
  ConnectedAppError,
  ConnectedAppRequestError,
  ConnectedAppStatusWithText,
  Email,
  EmailResponse,
  IConnectedApp,
  IConnectedAppProps,
  IMailSenderApp,
} from "@hacado/types";
import { decrypt, encrypt } from "@hacado/utils";
import { createEvent } from "ics";
import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import { SmtpConfiguration, smtpConfigurationSchema } from "./models";
import {
  SmtpAdminAllKeys,
  SmtpAdminKeys,
  SmtpAdminNamespace,
} from "./translations/types";

const MASKED_PASSWORD = "********";

export default class SmtpConnectedApp
  implements IConnectedApp<SmtpConfiguration>, IMailSenderApp
{
  protected readonly loggerFactory: LoggerFactory;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "SmtpConnectedApp",
      props.organizationId,
    );
  }

  public async processAppData(
    appData: SmtpConfiguration,
  ): Promise<SmtpConfiguration> {
    return {
      ...appData,
      auth: {
        ...appData.auth,
        pass: appData.auth?.pass ? MASKED_PASSWORD : undefined,
      },
    };
  }

  public async processRequest(
    appData: ConnectedAppData,
    request: SmtpConfiguration,
  ): Promise<ConnectedAppStatusWithText> {
    const logger = this.loggerFactory("processRequest");
    logger.debug(
      {
        appId: appData._id,
        host: request.host,
        port: request.port,
        secure: request.secure,
        email: request.email,
      },
      "Processing SMTP configuration request",
    );

    const { data, success, error } = smtpConfigurationSchema.safeParse(request);
    if (!success) {
      logger.error({ error }, "Invalid SMTP configuration request");
      throw new ConnectedAppRequestError(
        "invalid_smtp_configuration_request",
        { error },
        400,
        error.message,
      );
    }

    if (data?.auth?.pass === MASKED_PASSWORD && appData?.data?.auth?.pass) {
      data.auth = {
        ...data.auth,
        pass: appData.data.auth.pass,
      };
    } else if (data?.auth?.pass) {
      data.auth = {
        ...data.auth,
        pass: encrypt(data.auth.pass),
      };
    }

    try {
      const client = this.getClient(data);

      logger.debug(
        { appId: appData._id, host: data.host, port: data.port },
        "Verifying SMTP connection",
      );

      const result = await client.verify();

      if (!result) {
        logger.error(
          { appId: appData._id, host: data.host, port: data.port },
          "SMTP connection verification failed",
        );

        throw new ConnectedAppError<SmtpAdminNamespace, SmtpAdminKeys>(
          "app_smtp_admin.statusText.connection_verification_failed",
        );
      }

      logger.debug(
        { appId: appData._id, host: data.host, port: data.port },
        "SMTP connection verified successfully",
      );

      const status: ConnectedAppStatusWithText<
        SmtpAdminNamespace,
        SmtpAdminKeys
      > = {
        status: "connected",
        statusText: "app_smtp_admin.statusText.successfully_connected",
      };

      this.props.update({
        account: {
          username: data.email,
          serverUrl: data.host,
        },
        data,
        ...status,
      });

      logger.info(
        { appId: appData._id, host: data.host, email: data.email },
        "Successfully connected to SMTP server",
      );

      logger.debug(
        { appId: appData._id, status: status.status },
        "Successfully configured SMTP",
      );

      return status;
    } catch (e: any) {
      logger.error(
        {
          appId: appData._id,
          host: data.host,
          error: e?.message || e?.toString(),
        },
        "Error processing SMTP configuration request",
      );

      const status: ConnectedAppStatusWithText = {
        status: "failed",
        statusText:
          e instanceof ConnectedAppError
            ? {
                key: e.key,
                args: e.args,
              }
            : ("app_smtp_admin.statusText.error_processing_configuration" satisfies SmtpAdminAllKeys),
      };

      this.props.update({
        ...status,
      });

      return status;
    }
  }

  public async sendMail(
    appData: ConnectedAppData,
    email: Email,
  ): Promise<EmailResponse> {
    const logger = this.loggerFactory("sendMail");
    logger.debug(
      {
        appId: appData._id,
        subject: email.subject,
        to: Array.isArray(email.to) ? email.to : [email.to],
        hasAttachments: !!email.attachments?.length,
        hasIcalEvent: !!email.icalEvent,
      },
      "Sending email via SMTP",
    );

    try {
      const smtpConfiguration = appData.data as SmtpConfiguration;
      const config =
        await this.props.services.configurationService.getConfiguration(
          "general",
        );

      logger.debug(
        { appId: appData._id, subject: email.subject },
        "Processing email attachments and iCal events",
      );

      let icalEvent: Mail.IcalAttachment | undefined = undefined;
      if (email.icalEvent) {
        logger.debug(
          { appId: appData._id, subject: email.subject },
          "Processing iCal event attachment",
        );

        const { value: icsContent, error: icsError } = createEvent(
          email.icalEvent.content,
        );

        if (!icsContent || icsError) {
          logger.error(
            { appId: appData._id, icsError },
            "Failed to parse iCal event",
          );
          throw new ConnectedAppError(
            "app_smtp_admin.statusText.error_parsing_ical_event" satisfies SmtpAdminAllKeys,
          );
        }

        icalEvent = {
          filename: email.icalEvent.filename || "invitation.ics",
          method: email.icalEvent.method,
          content: icsContent,
        };

        logger.debug(
          {
            appId: appData._id,
            subject: email.subject,
            filename: icalEvent.filename,
          },
          "Successfully created iCal event attachment",
        );
      }

      const attachments = await Promise.all(
        email.attachments?.map(async (attachment) => {
          const result = await this.props.services.assetsStorage.getFile(
            attachment.storageFilename,
          );
          if (!result) {
            throw new Error("Attachment not found");
          }
          const { stream } = result;
          return {
            cid: attachment.cid,
            filename: attachment.filename,
            content: stream,
          };
        }) ?? [],
      );

      const mailOptions: nodemailer.SendMailOptions = {
        from: {
          name: config.name,
          address: smtpConfiguration.email,
        },
        to: email.to,
        cc: email.cc,
        subject: email.subject,
        html: email.body,
        icalEvent: icalEvent,
        attachments,
      };

      logger.debug(
        {
          appId: appData._id,
          subject: email.subject,
          from: smtpConfiguration.email,
          to: Array.isArray(email.to) ? email.to : [email.to],
          attachmentCount: email.attachments?.length || 0,
        },
        "Prepared email options, sending via SMTP",
      );

      const client = this.getClient(smtpConfiguration);
      const result = await client.sendMail(mailOptions);

      logger.info(
        {
          appId: appData._id,
          subject: email.subject,
          messageId: result.messageId,
        },
        "Successfully sent email via SMTP",
      );

      return {
        messageId: result.messageId,
      };
    } catch (e: any) {
      logger.error(
        {
          appId: appData._id,
          subject: email.subject,
          error: e?.message || e?.toString(),
        },
        "Error sending email via SMTP",
      );

      const status: ConnectedAppStatusWithText = {
        status: "failed",
        statusText:
          e instanceof ConnectedAppError
            ? {
                key: e.key,
                args: e.args,
              }
            : ("app_smtp_admin.statusText.error_sending_email" satisfies SmtpAdminAllKeys),
      };

      this.props.update({
        ...status,
      });

      throw e;
    }
  }

  protected getClient(smtpConfiguration: SmtpConfiguration) {
    const logger = this.loggerFactory("getClient");
    logger.debug(
      {
        host: smtpConfiguration.host,
        port: smtpConfiguration.port,
        secure: smtpConfiguration.secure,
        email: smtpConfiguration.email,
      },
      "Creating SMTP client",
    );

    try {
      const client = nodemailer.createTransport({
        host: smtpConfiguration.host,
        port: smtpConfiguration.port,
        secure: smtpConfiguration.secure,
        auth: {
          user: smtpConfiguration.auth.user,
          pass: smtpConfiguration.auth.pass
            ? decrypt(smtpConfiguration.auth.pass)
            : undefined,
        },
      });

      logger.debug(
        { host: smtpConfiguration.host, port: smtpConfiguration.port },
        "SMTP client created successfully",
      );

      return client;
    } catch (error: any) {
      logger.error(
        {
          host: smtpConfiguration.host,
          port: smtpConfiguration.port,
          error: error?.message || error?.toString(),
        },
        "Error creating SMTP client",
      );
      throw error;
    }
  }
}
