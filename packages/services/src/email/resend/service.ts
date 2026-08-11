import { getLoggerFactory } from "@hacado/logger";
import {
  Email,
  EmailResponse,
  IAssetsStorage,
  IMailSender,
} from "@hacado/types";
import { createEvent } from "ics";
import { Resend } from "resend";
import { Readable } from "stream";
import { ResendConfiguration } from "./types";

async function readableToBuffer(readable: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export class ResendService implements IMailSender {
  protected readonly loggerFactory = getLoggerFactory("ResendService");
  private readonly client: Resend;

  public constructor(
    protected readonly configuration: ResendConfiguration,
    protected readonly storageService: IAssetsStorage,
  ) {
    this.client = new Resend(configuration.apiKey);
  }

  public async sendMail(
    email: Email,
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
      "Sending email via Resend",
    );

    try {
      const attachments: {
        filename: string;
        content: Buffer;
        contentType?: string;
        contentId?: string;
      }[] = [];

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

        const filename = email.icalEvent.filename || "invitation.ics";
        attachments.push({
          filename,
          content: Buffer.from(icsContent, "utf8"),
          contentType: `text/calendar; method=${email.icalEvent.method}; charset=UTF-8`,
        });

        logger.debug(
          { subject: email.subject, filename },
          "Successfully created iCal event attachment",
        );
      }

      if (email.attachments?.length) {
        const fileAttachments = await Promise.all(
          email.attachments.map(async (attachment) => {
            const result = await this.storageService.getFile(
              attachment.storageFilename,
            );
            if (!result) {
              throw new Error("Attachment not found");
            }

            const content = await readableToBuffer(result.stream);
            return {
              filename: attachment.filename,
              content,
              contentType: attachment.contentType,
              contentId: attachment.cid,
            };
          }),
        );
        attachments.push(...fileAttachments);
      }

      const from = `${fromName || this.configuration.fromName} <${this.configuration.email}>`;
      const to = Array.isArray(email.to) ? email.to : [email.to];
      const cc = email.cc
        ? Array.isArray(email.cc)
          ? email.cc
          : [email.cc]
        : undefined;

      logger.debug(
        {
          subject: email.subject,
          from: this.configuration.email,
          to,
          attachmentCount: attachments.length,
        },
        "Prepared email options, sending via Resend",
      );

      const { data, error } = await this.client.emails.send({
        from,
        to,
        cc,
        subject: email.subject,
        html: email.body,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      if (error) {
        throw new Error(error.message || "Failed to send email via Resend");
      }

      const messageId = data?.id;
      if (!messageId) {
        throw new Error("Resend did not return a message id");
      }

      logger.info(
        {
          subject: email.subject,
          messageId,
        },
        "Successfully sent email via Resend",
      );

      return { messageId };
    } catch (e: any) {
      logger.error(
        {
          subject: email.subject,
          error: e?.message || e?.toString(),
        },
        "Error sending email via Resend",
      );

      throw e;
    }
  }
}
