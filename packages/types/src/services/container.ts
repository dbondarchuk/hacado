import type { Redis } from "ioredis";
import type { IAssetsStorage } from "../apps/assets/assets-storage";
import type { IAssetsService } from "./assets.service";
import type { IBillingService } from "./billing.service";
import type { IBookingService } from "./booking.service";
import type { ICommunicationLogsService } from "./communication-logs.service";
import type { IActivityService } from "./activity.service";
import type { IConfigurationService } from "./configuration.service";
import type { IConnectedAppsService } from "./connected-apps.service";
import type { IEventService } from "./event.service";
import type { ICustomerAuthService } from "./customer-auth.service";
import type { ICustomersService } from "./customers.service";
import type { IGiftCardsService } from "./gift-cards.service";
import type { IJobService } from "./job.service";
import type {
  IDashboardNotificationsService,
  INotificationService,
} from "./notification.service";
import type { IOrganizationService } from "./organization.service";
import type { IPagesService } from "./pages.service";
import type { IPaymentsService } from "./payments.service";
import type { IScheduleService } from "./schedule.service";
import type { ISyncedPaymentsService } from "./synced-payments.service";
import type { IServicesService } from "./services.service";
import type { ITemplatesService } from "./templates.service";
import type { ITeamService } from "./team.service";

export type IServicesContainer = {
  activityService: IActivityService;
  configurationService: IConfigurationService;
  assetsStorage: IAssetsStorage;
  assetsService: IAssetsService;
  bookingService: IBookingService;
  pagesService: IPagesService;
  customersService: ICustomersService;
  servicesService: IServicesService;
  scheduleService: IScheduleService;
  templatesService: ITemplatesService;
  communicationLogsService: ICommunicationLogsService;
  connectedAppsService: IConnectedAppsService;
  eventService: IEventService;
  notificationService: INotificationService;
  paymentsService: IPaymentsService;
  syncedPaymentsService: ISyncedPaymentsService;
  jobService: IJobService;
  organizationService: IOrganizationService;
  teamService: ITeamService;
  dashboardNotificationsService: IDashboardNotificationsService;
  giftCardsService: IGiftCardsService;
  billingService: IBillingService;
  customerAuthService: ICustomerAuthService;
  redisClient: Redis;
};
