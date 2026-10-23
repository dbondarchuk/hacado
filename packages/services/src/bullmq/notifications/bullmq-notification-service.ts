import { getLoggerFactory } from "@hacado/logger";
import {
  CustomerSmsConsentStatus,
  Email,
  EmailNotificationRequest,
  INotificationService,
  ISystemNotificationService,
  SmsConsentWrite,
  TextMessage,
  TextMessageNotificationRequest,
  TextMessageResponse,
  WithOrganizationId,
} from "@hacado/types";
import { normalizeToE164 } from "@hacado/utils";
import { Job } from "bullmq";
import { readSmsMessagingAccess } from "../../text-message/messaging-access";
import { SmsStore } from "../../text-message/sms-store";
import { BaseBullMQClient } from "../base-bullmq-client";
import { BullMQNotificationConfig } from "./types";

export type EmailJobData = WithOrganizationId<{
  type: "email";
  data: EmailNotificationRequest;
}>;

export type TextMessageJobData = WithOrganizationId<{
  type: "text-message";
  data: TextMessageNotificationRequest;
}>;

export type SystemEmailJobData = {
  type: "system-email";
  data: Email;
};

export type SystemTextMessageJobData = {
  type: "system-text-message";
  data: TextMessage;
};

export type NotificationJobData =
  | EmailJobData
  | TextMessageJobData
  | SystemEmailJobData
  | SystemTextMessageJobData;

export class BullMQNotificationService
  extends BaseBullMQClient
  implements INotificationService
{
  protected readonly config: BullMQNotificationConfig;

  constructor(
    protected readonly organizationId: string,
    config: BullMQNotificationConfig,
  ) {
    super(
      config,
      getLoggerFactory("BullMQNotificationService", organizationId),
    );

    this.config = config;
    this.initializeQueues();
  }

  private initializeQueues(): void {
    const logger = this.loggerFactory("initializeQueues");

    // Create email queue
    const emailQueue = this.createQueue(this.config.queues.email.name);
    // this.createQueueEvents(this.config.queues.email.name);

    // Create text message queue
    const textMessageQueue = this.createQueue(
      this.config.queues.textMessage.name,
    );

    // this.createQueueEvents(this.config.queues.textMessage.name);

    logger.info("BullMQ notification queues initialized");
  }

  public async recordCustomerSmsConsent(input: SmsConsentWrite): Promise<void> {
    const phone = normalizeToE164(input.phone);
    if (!phone) {
      return;
    }

    await new SmsStore().recordConsent({
      organizationId: this.organizationId,
      phone,
      consented: input.consented,
      source: input.source,
      ip: input.ip,
    });
  }

  public async hasActiveCustomerSmsConsent(phone: string): Promise<boolean> {
    const normalized = normalizeToE164(phone);
    if (!normalized) {
      return false;
    }

    const store = new SmsStore();
    if (await store.isOptedOut(normalized)) {
      return false;
    }

    return store.latestConsent(this.organizationId, normalized);
  }

  public getSmsMessagingAccess() {
    return readSmsMessagingAccess(this.organizationId);
  }

  public async getCustomerSmsConsentStatus(
    phone: string,
  ): Promise<CustomerSmsConsentStatus> {
    const normalized = normalizeToE164(phone);
    if (!normalized) {
      return { consented: false, optedOut: false };
    }

    const store = new SmsStore();
    const [consented, optedOut] = await Promise.all([
      store.latestConsent(this.organizationId, normalized),
      store.isOptedOut(normalized),
    ]);

    return { consented, optedOut };
  }

  public async sendEmail(data: EmailNotificationRequest): Promise<void> {
    const logger = this.loggerFactory("sendEmail");

    const jobData: EmailJobData = {
      type: "email",
      data,
      organizationId: this.organizationId,
    };

    try {
      const queue = this.getQueue(this.config.queues.email.name);
      const job = await queue.add("email-notification", jobData, {
        priority: 0,
        delay: 0,
      });

      logger.info(
        {
          jobId: job.id,
          emailTo: Array.isArray(data.email.to)
            ? data.email.to.join(", ")
            : data.email.to,
          subject: data.email.subject,
          appointmentId: data.appointmentId,
          customerId: data.customerId,
        },
        "Email notification job added to queue",
      );
    } catch (error) {
      logger.error(
        { error, data },
        "Failed to add email notification to queue",
      );
      throw error;
    }
  }

  public async sendTextMessage(
    data: TextMessageNotificationRequest,
  ): Promise<TextMessageResponse> {
    const logger = this.loggerFactory("sendTextMessage");

    const jobData: TextMessageJobData = {
      type: "text-message",
      data,
      organizationId: this.organizationId,
    };

    try {
      const queue = this.getQueue(this.config.queues.textMessage.name);
      const job = await queue.add("text-message-notification", jobData, {
        priority: 0,
        delay: 0,
        ...(data.idempotencyKey
          ? { jobId: data.idempotencyKey.replaceAll(":", "_") }
          : {}),
      });

      logger.info(
        {
          jobId: job.id,
          phone: data.phone,
          sender: data.sender,
          appointmentId: data.appointmentId,
          customerId: data.customerId,
        },
        "Text message notification job added to queue",
      );

      // Return a mock response since the actual sending happens asynchronously
      return {
        success: true,
        textId: job.id?.toString() || "unknown",
        data: { provider: "bullmq" },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (data.idempotencyKey && /already exists|JobId/i.test(message)) {
        return { success: true, skipped: true };
      }

      logger.error(
        {
          organizationId: this.organizationId,
          appointmentId: data.appointmentId,
          error: message,
        },
        "Failed to add text message notification to queue",
      );
      throw error;
    }
  }

  public async getEmailQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    return this.getQueueStats(this.config.queues.email.name);
  }

  public async getTextMessageQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    return this.getQueueStats(this.config.queues.textMessage.name);
  }

  public async getAllNotificationQueueStats(): Promise<{
    email: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
    };
    textMessage: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
    };
  }> {
    const [emailStats, textMessageStats] = await Promise.all([
      this.getEmailQueueStats(),
      this.getTextMessageQueueStats(),
    ]);

    return {
      email: emailStats,
      textMessage: textMessageStats,
    };
  }

  public async addEmailWithOptions(
    data: EmailNotificationRequest,
    options?: {
      delay?: number;
      priority?: number;
      maxRetries?: number;
    },
  ): Promise<Job> {
    const logger = this.loggerFactory("addEmailWithOptions");

    const jobData: EmailJobData = {
      type: "email",
      data,
      organizationId: this.organizationId,
    };

    const queue = this.getQueue(this.config.queues.email.name);
    const job = await queue.add("email-notification", jobData, {
      priority: options?.priority || 0,
      delay: options?.delay || 0,
      attempts: options?.maxRetries || this.config.defaultJobOptions.attempts,
    });

    logger.info(
      {
        jobId: job.id,
        emailTo: Array.isArray(data.email.to)
          ? data.email.to.join(", ")
          : data.email.to,
        subject: data.email.subject,
        appointmentId: data.appointmentId,
        customerId: data.customerId,
        options,
      },
      "Email notification job added to queue with custom options",
    );

    return job;
  }

  public async addTextMessageWithOptions(
    data: TextMessageNotificationRequest,
    options?: {
      delay?: number;
      priority?: number;
      maxRetries?: number;
    },
  ): Promise<Job> {
    const logger = this.loggerFactory("addTextMessageWithOptions");

    const jobData: TextMessageJobData = {
      type: "text-message",
      data,
      organizationId: this.organizationId,
    };

    const queue = this.getQueue(this.config.queues.textMessage.name);
    const job = await queue.add("text-message-notification", jobData, {
      priority: options?.priority || 0,
      delay: options?.delay || 0,
      attempts: options?.maxRetries || this.config.defaultJobOptions.attempts,
      ...(data.idempotencyKey
        ? { jobId: data.idempotencyKey.replaceAll(":", "_") }
        : {}),
    });

    logger.info(
      {
        jobId: job.id,
        phone: data.phone,
        sender: data.sender,
        appointmentId: data.appointmentId,
        customerId: data.customerId,
        options,
      },
      "Text message notification job added to queue with custom options",
    );

    return job;
  }
}

export class BullMQSystemNotificationService
  extends BaseBullMQClient
  implements ISystemNotificationService
{
  protected readonly config: BullMQNotificationConfig;

  constructor(config: BullMQNotificationConfig) {
    super(config, getLoggerFactory("BullMQSystemNotificationService"));

    this.config = config;
    this.initializeQueues();
  }

  private initializeQueues(): void {
    const logger = this.loggerFactory("initializeQueues");

    // Create email queue
    const emailQueue = this.createQueue(this.config.queues.email.name);
    // this.createQueueEvents(this.config.queues.email.name);

    // Create text message queue
    const textMessageQueue = this.createQueue(
      this.config.queues.textMessage.name,
    );

    logger.info("BullMQ notification queues initialized");
  }

  public async sendSystemEmail(data: Email): Promise<void> {
    const logger = this.loggerFactory("sendSystemEmail");

    const jobData: SystemEmailJobData = {
      type: "system-email",
      data,
    };

    try {
      const queue = this.getQueue(this.config.queues.email.name);
      const job = await queue.add("system-email-notification", jobData, {
        priority: 0,
        delay: 0,
      });

      logger.info(
        {
          jobId: job.id,
          emailTo: Array.isArray(data.to) ? data.to.join(", ") : data.to,
          subject: data.subject,
        },
        "Systme email notification job added to queue",
      );
    } catch (error) {
      logger.error(
        { error, data },
        "Failed to add system email notification to queue",
      );
      throw error;
    }
  }

  public async sendSystemTextMessage(data: TextMessage): Promise<void> {
    const logger = this.loggerFactory("sendSystemTextMessage");

    const jobData: SystemTextMessageJobData = {
      type: "system-text-message",
      data,
    };

    try {
      const queue = this.getQueue(this.config.queues.textMessage.name);
      const job = await queue.add("system-text-message-notification", jobData, {
        priority: 0,
        delay: 0,
      });

      logger.info(
        {
          jobId: job.id,
          phone: data.phone,
          sender: data.sender,
        },
        "System text message notification job added to queue",
      );
    } catch (error) {
      logger.error(
        { error, data },
        "Failed to add system text message notification to queue",
      );
      throw error;
    }
  }
}
