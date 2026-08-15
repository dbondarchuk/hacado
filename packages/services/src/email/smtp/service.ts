import { getLoggerFactory } from "@hacado/logger";
import {
  CommunicationParticipantType,
  Email,
  EmailResponse,
  IAssetsStorage,
  IMailSender,
} from "@hacado/types";
import { createEvent } from "ics";
import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import { SmtpConfiguration } from "./types";

export class SmtpService implements IMailSender {
  protected readonly loggerFactory = getLoggerFactory("SmtpService");

  public constructor(
    protected readonly configuration: SmtpConfiguration,
    protected readonly storageService: IAssetsStorage,
  ) {}

  public async sendMail(
    email: Email,
    _target: CommunicationParticipantType,
    fromName?: string,
  ): Promise<EmailResponse> {
    const logger = this.loggerFactory("sendMail");
    logger.debug(
      {
        subject: email.subject,
        to: Array.isArray(email.to) ? email.to : [email.to],
        hasAttachments: !!email.attachments?.length,
        hasIcalEvent: !!email.icalEvent,
        fromName: fromName,
      },
      "Sending email via SMTP",
    );

    try {
      logger.debug(
        { subject: email.subject },
        "Processing email attachments and iCal events",
      );

      let icalEvent: Mail.IcalAttachment | undefined = undefined;
      if (email.icalEvent) {
        logger.debug(
          { subject: email.subject },
          "Processing iCal event attachment",
        );

        const { value: icsContent, error: icsError } = createEvent(
          email.icalEvent.content,
        );

        if (!icsContent || icsError) {
          logger.error({ icsError }, "Failed to parse iCal event");

          throw new Error("Failed to parse iCal event");
        }

        icalEvent = {
          filename: email.icalEvent.filename || "invitation.ics",
          method: email.icalEvent.method,
          content: icsContent,
        };

        logger.debug(
          {
            subject: email.subject,
            filename: icalEvent.filename,
          },
          "Successfully created iCal event attachment",
        );
      }

      const attachments = await Promise.all(
        email.attachments?.map(async (attachment) => {
          const result = await this.storageService.getFile(
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
          name: fromName || this.configuration.fromName,
          address: this.configuration.email,
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
          subject: email.subject,
          from: this.configuration.email,
          to: Array.isArray(email.to) ? email.to : [email.to],
          attachmentCount: email.attachments?.length || 0,
        },
        "Prepared email options, sending via SMTP",
      );

      const client = this.getClient();
      const result = await client.sendMail(mailOptions);

      logger.info(
        {
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
          subject: email.subject,
          error: e?.message || e?.toString(),
        },
        "Error sending email via SMTP",
      );

      throw e;
    }
  }

  protected getClient() {
    const logger = this.loggerFactory("getClient");
    logger.debug(
      {
        host: this.configuration.host,
        port: this.configuration.port,
        secure: this.configuration.secure,
        email: this.configuration.email,
      },
      "Creating SMTP client",
    );

    try {
      const client = nodemailer.createTransport({
        host: this.configuration.host,
        port: this.configuration.port,
        secure: this.configuration.secure,
        auth: {
          user: this.configuration.auth.user,
          pass: this.configuration.auth.pass,
        },
      });

      logger.debug(
        { host: this.configuration.host, port: this.configuration.port },
        "SMTP client created successfully",
      );

      return client;
    } catch (error: any) {
      logger.error(
        {
          host: this.configuration.host,
          port: this.configuration.port,
          error: error?.message || error?.toString(),
        },
        "Error creating SMTP client",
      );
      throw error;
    }
  }
}
