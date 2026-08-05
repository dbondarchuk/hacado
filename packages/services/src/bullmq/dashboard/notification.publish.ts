import type { LoggerFactory } from "@hacado/logger";
import { getLoggerFactory } from "@hacado/logger";
import type {
  DashboardNotification,
  IDashboardNotificationsService,
} from "@hacado/types";
import type { Redis } from "ioredis";

export class RedisDashboardNotificationPublisher
  implements IDashboardNotificationsService
{
  protected readonly loggerFactory: LoggerFactory;

  public constructor(
    protected readonly organizationId: string,
    protected readonly redisClient: Redis,
  ) {
    this.loggerFactory = getLoggerFactory(
      "RedisDashboardNotificationPublisher",
      organizationId,
    );
  }

  public async publishNotification(
    notification: DashboardNotification,
  ): Promise<void> {
    const logger = this.loggerFactory("publishNotification");
    logger.info({ notification }, "Publishing notification");

    const count = await this.redisClient.publish(
      `dashboard:notifications:${this.organizationId}`,
      JSON.stringify(notification),
    );

    logger.info({ count }, "Notification published");
  }
}
