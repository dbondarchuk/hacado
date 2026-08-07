import { IServicesContainer } from "@hacado/types";
import { cache } from "react";
import { ActivityService } from "./activity.service";
import { AssetsService } from "./assets.service";
import { PolarBillingService } from "./billing/polar-billing.service";
import { getPolarClient } from "./billing/utils";
import { BookingService } from "./booking.service";
import {
  BullMQJobService,
  BullMQNotificationService,
  BullMQSystemNotificationService,
  getBullMQJobConfig,
  getBullMQNotificationConfig,
  RedisDashboardNotificationPublisher,
} from "./bullmq";
import { getRedisClient } from "./bullmq/redis-client";
import { CommunicationLogsService } from "./communication-logs.service";
import { CachedConfigurationService } from "./configuration-cached.service";
import { ConfigurationService } from "./configuration.service";
import { CachedConnectedAppsService } from "./connected-apps.service";
import { CustomerAuthService } from "./customer-auth.service";
import { CustomersService } from "./customers.service";
import { BullMQEventService, getBullMQEventConfig } from "./events";
import { GiftCardsService } from "./gift-cards.service";
import { OrganizationService } from "./organization.service";
import { CachedPagesService } from "./pages-cached.service";
import { PaymentsService } from "./payments.service";
import { S3AssetsStorageService } from "./s3-assets-storage";
import { getS3Configuration } from "./s3-assets-storage/utils";
import { ScheduleService } from "./schedule.service";
import { ServicesService } from "./services.service";
import { SyncedPaymentsService } from "./synced-payments.service";
import { TeamService } from "./team.service";
import { TemplatesService } from "./templates.service";

// BullMQ exports
export * from "./bullmq";
export * from "./events";

// Text message exports
export * from "./text-message";

export * from "./activity.service";
export * from "./assets.service";
export * from "./billing";
export * from "./booking.service";
export * from "./communication-logs.service";
export * from "./configuration-cached.service";
export * from "./configuration.service";
export * from "./connected-apps.service";
export * from "./customer-auth.service";
export * from "./customers.service";
export * from "./email";
export * from "./gift-cards.service";
export * from "./organization-hostname-cache";
export * from "./organization.service";
export * from "./pages-cached.service";
export * from "./pages.service";
export * from "./payments.service";
export * from "./s3-assets-storage";
export * from "./schedule.service";
export * from "./services.service";
export * from "./synced-payments.service";
export * from "./team.service";

/**
 * ServicesContainer provides organization-scoped services
 * Each service must be created with a organizationId to ensure proper isolation
 */

export const ServicesContainer: (
  organizationId: string,
  noCachedServices?: boolean,
) => IServicesContainer = cache(
  (organizationId: string, noCachedServices?: boolean) => {
    const redisClient = getRedisClient();
    const jobService = new BullMQJobService(
      organizationId,
      getBullMQJobConfig(),
    );

    const eventService = new BullMQEventService(
      organizationId,
      getBullMQEventConfig(),
    );

    const configurationService = noCachedServices
      ? new ConfigurationService(organizationId, eventService)
      : new CachedConfigurationService(
          organizationId,
          eventService,
          redisClient,
        );

    const assetsStorage = new S3AssetsStorageService(
      organizationId,
      getS3Configuration(),
    );

    const dashboardNotificationsService =
      new RedisDashboardNotificationPublisher(organizationId, redisClient);
    const organizationService = new OrganizationService(
      organizationId,
      eventService,
    );

    const assetsService = new AssetsService(
      organizationId,
      configurationService,
      assetsStorage,
      eventService,
      organizationService,
    );

    const teamService = new TeamService(organizationId, eventService);
    const customersService = new CustomersService(organizationId, eventService);
    const activityService = new ActivityService(
      organizationId,
      dashboardNotificationsService,
      redisClient,
    );

    const connectedAppsService = new CachedConnectedAppsService(
      organizationId,
      (orgId) => {
        if (!orgId || orgId === organizationId) {
          return services;
        }

        return ServicesContainer(orgId);
      },
    );

    const scheduleService = new ScheduleService(
      connectedAppsService,
      configurationService,
    );

    const servicesService = new ServicesService(
      organizationId,
      configurationService,
      eventService,
      organizationService,
    );

    const paymentsService = new PaymentsService(
      organizationId,
      connectedAppsService,
      eventService,
    );

    const billingService = new PolarBillingService(
      organizationId,
      organizationService,
      eventService,
      getPolarClient(),
    );

    const bookingService = new BookingService(
      organizationId,
      configurationService,
      connectedAppsService,
      assetsService,
      customersService,
      scheduleService,
      servicesService,
      paymentsService,
      eventService,
      organizationService,
      billingService,
      teamService,
    );

    const syncedPaymentsService = new SyncedPaymentsService(
      organizationId,
      bookingService,
      paymentsService,
      eventService,
    );

    const pagesService = new CachedPagesService(
      organizationId,
      eventService,
      organizationService,
      redisClient,
    );

    const templatesService = new TemplatesService(organizationId, eventService);
    const communicationLogsService = new CommunicationLogsService(
      organizationId,
      assetsStorage,
    );

    const notificationService = new BullMQNotificationService(
      organizationId,
      getBullMQNotificationConfig(),
    );

    const giftCardsService = new GiftCardsService(
      organizationId,
      paymentsService,
      eventService,
    );

    const customerAuthService = new CustomerAuthService(organizationId, {
      configurationService,
      customersService,
      notificationService,
      organizationService,
      redisClient,
      templatesService,
    });

    const services: IServicesContainer = {
      activityService,
      configurationService,
      assetsStorage,
      assetsService,
      bookingService,
      pagesService,
      customersService,
      servicesService,
      scheduleService,
      templatesService,
      communicationLogsService,
      connectedAppsService,
      paymentsService,
      syncedPaymentsService,
      jobService,
      eventService,
      notificationService,
      organizationService,
      teamService,
      dashboardNotificationsService,
      giftCardsService,
      billingService,
      customerAuthService,
      redisClient,
    };

    return services;
  },
);

export const SystemServicesContainer = cache(() => {
  const notificationService = new BullMQSystemNotificationService(
    getBullMQNotificationConfig(),
  );

  return {
    notificationService,
  };
});
