import { getOpenAppointmentsCreatedInBillingCycleCount } from "./billing/free-tier-appointment-usage";
import { resolvePlanTierFromOrganization } from "./billing/subscription-entitlements";
import { getDbClient, getDbConnection } from "./database";

import { AvailableAppServices } from "@hacado/app-store/services";

import {
  ApplyGiftCardsSuccessResponse,
  Appointment,
  APPOINTMENT_CREATED_EVENT_TYPE,
  APPOINTMENT_RESCHEDULED_EVENT_TYPE,
  APPOINTMENT_SLOT_RESCHEDULED_EVENT_TYPE,
  APPOINTMENT_STATUS_CHANGED_EVENT_TYPE,
  AppointmentChoice,
  AppointmentEntity,
  AppointmentHistoryEntry,
  AppointmentLimitReachedError,
  AppointmentOnlineMeetingInformation,
  AppointmentTimeNotAvaialbleError,
  AppointmentWithReferenceDateDistance,
  BillingPlanTier,
  BookingCatalogNode,
  BookingRestriction,
  BookingRestrictionCode,
  closedAppointmentStatusMongoFilter,
  Customer,
  DISCOUNT_APPLIED_EVENT_TYPE,
  FieldSchema,
  flattenCatalogOptionIds,
  flattenCatalogPackageIds,
  FREE_TIER_LIMITS,
  getActiveStaffForAssignments,
  GetAppointmentOptionsResponse,
  IAvailabilityProvider,
  IBillingService,
  IEventService,
  IMeetingUrlProvider,
  IOrganizationService,
  IPackagesService,
  IPaymentsService,
  isClosedAppointmentStatus,
  IServicesService,
  ITeamService,
  openAppointmentStatusMongoFilter,
  OrganizationMember,
  Payment,
  PaymentHistory,
  PublicStaffMember,
  TimeSlot,
  type AppointmentCreatedPayload,
  type AppointmentEvent,
  type AppointmentRescheduledPayload,
  type AppointmentSlotRescheduledPayload,
  type AppointmentStatus,
  type AppointmentStatusChangedPayload,
  type Asset,
  type Availability,
  type BookingConfiguration,
  type CalendarEvent,
  type DaySchedule,
  type DiscountAppliedPayload,
  type EventSource,
  type GeneralConfiguration,
  type GetAppointmentsQuery,
  type GetAppointmentsQueryWithReferenceDate,
  type IAssetsService,
  type IBookingService,
  type ICalendarBusyTimeProvider,
  type IConfigurationService,
  type IConnectedAppsService,
  type ICustomersService,
  type IScheduleService,
  type Period,
  type Query,
  type WithTotal,
} from "@hacado/types";
import {
  buildSearchQuery,
  canUseMemberCalendarSources,
  escapeRegex,
  fileNameToMimeType,
  getAdminUrl,
  getAppointmentBucket,
  getAvailableTimeSlotsInCalendar,
  getIcsEventUid,
  omit,
  parseTime,
} from "@hacado/utils";
import { DateTime } from "luxon";
import { Document, Filter, ObjectId, Sort } from "mongodb";
import { v4 } from "uuid";
import {
  APPOINTMENTS_COLLECTION_NAME,
  APPOINTMENTS_HISTORY_COLLECTION_NAME,
  ASSETS_COLLECTION_NAME,
  CUSTOMER_PACKAGES_COLLECTION_NAME,
  CUSTOMERS_COLLECTION_NAME,
  MEMBERS_COLLECTION_NAME,
  PAYMENTS_COLLECTION_NAME,
} from "./collections";
import { BaseService } from "./services/base.service";

function historyActorFields(eventSource: EventSource): {
  by: "customer" | "member";
  memberId?: string;
} {
  if (eventSource.actor === "member") {
    return { by: "member", memberId: eventSource.actorId };
  }
  return { by: "customer" };
}

function enrichEventSourceWithCustomerId(
  eventSource: EventSource,
  customerId: string,
): EventSource {
  if (eventSource.actor === "customer") {
    return { ...eventSource, actorId: customerId };
  }

  return eventSource;
}

export class BookingService extends BaseService implements IBookingService {
  constructor(
    organizationId: string,
    private readonly configurationService: IConfigurationService,
    private readonly appsService: IConnectedAppsService,
    private readonly assetsService: IAssetsService,
    private readonly customersService: ICustomersService,
    private readonly scheduleService: IScheduleService,
    private readonly servicesService: IServicesService,
    private readonly paymentsService: IPaymentsService,
    private readonly eventService: IEventService,
    private readonly organizationService: IOrganizationService,
    private readonly billingService: IBillingService,
    private readonly teamService: ITeamService,
    private readonly packagesService: IPackagesService,
  ) {
    super("bookingService", organizationId);
  }

  private async getFreeTierBookingRestriction(): Promise<
    BookingRestriction | undefined
  > {
    const organization = await this.organizationService.getOrganization();
    const planTier = resolvePlanTierFromOrganization(organization);
    if (planTier !== BillingPlanTier.Free) {
      return undefined;
    }

    const count = await getOpenAppointmentsCreatedInBillingCycleCount(
      this.organizationId,
      this.billingService,
    );

    if (count >= FREE_TIER_LIMITS.appointments) {
      return { code: BookingRestrictionCode.LimitReached };
    }

    return undefined;
  }

  private async assertFreeTierAppointmentLimit(): Promise<void> {
    const restriction = await this.getFreeTierBookingRestriction();
    if (restriction) {
      throw new AppointmentLimitReachedError(FREE_TIER_LIMITS.appointments);
    }
  }

  public async getAvailability(
    duration: number,
    memberId: string,
    options?: { from?: Date; to?: Date },
  ): Promise<Availability> {
    const logger = this.loggerFactory("getAvailability");
    logger.debug({ duration, memberId, options }, "Getting availability");

    const { booking: config, general: generalConfig } =
      await this.configurationService.getConfigurations("booking", "general");

    const earliestBookable = DateTime.now().plus({
      hours: config.minHoursBeforeBooking || 0,
    });
    const defaultEnd = earliestBookable.plus({
      weeks: config.maxWeeksInFuture ?? 8,
    });

    const requestedFrom = options?.from
      ? DateTime.fromJSDate(options.from)
      : earliestBookable;
    const requestedTo = options?.to
      ? DateTime.fromJSDate(options.to)
      : defaultEnd;

    let start =
      requestedFrom < earliestBookable ? earliestBookable : requestedFrom;
    let end = requestedTo > defaultEnd ? defaultEnd : requestedTo;

    if (start >= end) {
      logger.debug(
        { duration, memberId, start, end },
        "Availability range is empty after minHoursBeforeBooking clamp",
      );
      return [];
    }

    const scoped = options?.from != null || options?.to != null;
    const events = scoped
      ? await this.getBusyTimes(requestedFrom, requestedTo, config, memberId)
      : await this.getBusyEvents({ memberId });

    const schedule = await this.scheduleService.getSchedule(
      (scoped ? requestedFrom : start).toJSDate(),
      (scoped ? requestedTo : end).toJSDate(),
      memberId,
    );

    const availability = await this.getAvailableTimes(
      start,
      end,
      duration,
      events,
      config,
      generalConfig,
      schedule,
    );

    logger.debug(
      { duration, start, end, availableSlots: availability.length },
      "Availability retrieved",
    );

    return availability;
  }

  public async getBusyEventsInTimeFrame(
    start: Date,
    end: Date,
    options?: { memberId?: string },
  ): Promise<Period[]> {
    const logger = this.loggerFactory("getBusyEventsInTimeFrame");
    const memberId = options?.memberId;
    logger.debug({ start, end, memberId }, "Getting busy events in time frame");

    const config = await this.configurationService.getConfiguration("booking");

    const events = await this.getBusyTimes(
      DateTime.fromJSDate(start),
      DateTime.fromJSDate(end),
      config,
      memberId,
    );

    logger.debug(
      { start, end, eventCount: events.length },
      "Busy events in time frame retrieved",
    );

    return events;
  }

  public async getBusyEvents(options?: {
    memberId?: string;
  }): Promise<Period[]> {
    const logger = this.loggerFactory("getBusyEvents");
    const memberId = options?.memberId;
    logger.debug({ memberId }, "Getting busy events");

    const config = await this.configurationService.getConfiguration("booking");

    const start = DateTime.utc();
    const end = DateTime.utc().plus({ weeks: config.maxWeeksInFuture ?? 8 });

    const events = await this.getBusyTimes(start, end, config, memberId);

    logger.debug({ eventCount: events.length }, "Busy events retrieved");

    return events;
  }

  public async createAppointment({
    event,
    confirmed: propsConfirmed,
    force = false,
    files,
    paymentIntentId,
    eventSource,
    giftCards,
    memberId,
    customerPackageId,
    purchasePackageId,
  }: {
    event: AppointmentEvent;
    confirmed?: boolean;
    force?: boolean;
    files?: Record<string, File>;
    paymentIntentId?: string;
    eventSource: EventSource;
    giftCards?: ApplyGiftCardsSuccessResponse["giftCards"];
    memberId?: string;
    customerPackageId?: string;
    purchasePackageId?: string;
  }): Promise<Appointment> {
    const logger = this.loggerFactory("createAppointment");
    logger.debug(
      {
        event: {
          dateTime: event.dateTime,
          totalDuration: event.totalDuration,
          customerName: event.fields.name,
          customerEmail: event.fields.email,
          customerPhone: event.fields.phone,
          optionName: event.option.name,
          optionIsOnline: event.option.isOnline,
          data: event.data,
        },
        confirmed: propsConfirmed,
        force,
        fileCount: files ? Object.keys(files).length : 0,
        paymentIntentId,
        memberId,
      },
      "Creating event",
    );

    await this.assertFreeTierAppointmentLimit();

    const resolvedMemberId = memberId ?? (await this.resolveDefaultMemberId());

    const { booking: config, general: generalConfig } =
      await this.configurationService.getConfigurations("booking", "general");

    if (!force) {
      const isAvailable = await this.verifyTimeAvailability(
        event.dateTime,
        event.totalDuration,
        resolvedMemberId,
        config,
        generalConfig,
      );

      if (!isAvailable) {
        logger.error(
          { dateTime: event.dateTime, duration: event.totalDuration },
          "Event time is not available",
        );

        throw new AppointmentTimeNotAvaialbleError("Time is not available");
      }
    }

    const customer = await this.customersService.getOrUpsertCustomer(
      event.fields,
      eventSource,
    );

    const enrichedEventSource = enrichEventSourceWithCustomerId(
      eventSource,
      customer._id,
    );

    const appointmentId = new ObjectId().toString();
    const assets: Asset[] = [];
    if (files) {
      logger.debug(
        { appointmentId, fileCount: Object.keys(files).length },
        "Processing files for event",
      );

      for (const [fieldId, file] of Object.entries(files)) {
        const fileType = fileNameToMimeType(file.name);

        const asset = await this.assetsService.createAsset(
          {
            filename: `${getAppointmentBucket(appointmentId)}/${fieldId}-${file.name}`,
            mimeType: fileType,
            appointmentId,
            description: `${event.fields.name} - ${event.option.name} - ${fieldId}`,
          },
          file,
          enrichedEventSource,
        );

        assets.push(asset);
      }
    }

    const option = await this.servicesService.getOption(event.option._id);

    let autoConfirmSetting = option?.isAutoConfirm;
    if (customerPackageId || purchasePackageId) {
      let catalogPackageId = purchasePackageId;
      if (!catalogPackageId && customerPackageId) {
        const sold =
          await this.packagesService.getCustomerPackage(customerPackageId);
        catalogPackageId = sold?.packageId;
      }
      if (catalogPackageId) {
        const pkg = await this.packagesService.getPackage(catalogPackageId);
        if (pkg) {
          autoConfirmSetting = pkg.isAutoConfirm ?? "inherit";
        }
      }
    }

    const isAutoConfirm = autoConfirmSetting ?? config.autoConfirm;
    logger.debug(
      {
        isAutoConfirm,
        isOptionAutoConfirm: option?.isAutoConfirm,
        packageAutoConfirm: autoConfirmSetting,
        autoConfirm: config.autoConfirm,
        customerPackageId,
        purchasePackageId,
      },
      "Service option auto confirm",
    );

    const confirmed =
      propsConfirmed ??
      (autoConfirmSetting === "always" ||
        (autoConfirmSetting === "inherit" && config.autoConfirm)) ??
      false;

    let meetingInformation: AppointmentOnlineMeetingInformation | undefined =
      undefined;
    if (option?.isOnline) {
      const member = await this.teamService.getMemberById(resolvedMemberId);
      const meetingProviderAppId = member?.meetingUrlProviderAppId;

      if (meetingProviderAppId) {
        logger.debug(
          { appointmentId, meetingProviderAppId, memberId: resolvedMemberId },
          "Online option - creating meeting link via member meeting URL provider",
        );

        try {
          const { app, service } =
            await this.appsService.getAppService<IMeetingUrlProvider>(
              meetingProviderAppId,
            );

          meetingInformation = await service.getMeetingUrl(app, {
            ...event,
            _id: appointmentId,
          });

          logger.debug(
            {
              appointmentId,
              meetingProviderAppId,
              meetingInformation,
            },
            "Successfully created meeting information",
          );
        } catch (error: any) {
          logger.error(
            {
              appointmentId,
              meetingProviderAppId,
              error,
            },
            "Meeting URL creation has failed",
          );
        }
      } else {
        logger.warn(
          { appointmentId, memberId: resolvedMemberId },
          "Online option but member has no meeting URL provider configured",
        );
      }
    }

    logger.debug(
      {
        appointmentId,
        confirmed,
        force,
        paymentIntentId,
        giftCardsLength: giftCards?.length ?? 0,
      },
      "Saving event",
    );

    const appointment = await this.saveEvent(
      appointmentId,
      event,
      enrichedEventSource,
      customer,
      resolvedMemberId,
      assets.length ? assets : undefined,
      paymentIntentId,
      meetingInformation,
      confirmed ? "confirmed" : "pending",
      force,
      giftCards,
      customerPackageId,
      purchasePackageId,
    );

    logger.debug(
      { appointmentId, confirmed, force, paymentIntentId },
      "Event saved, executing hooks",
    );

    await this.eventService.emit(
      APPOINTMENT_CREATED_EVENT_TYPE,
      {
        appointment,
        confirmed,
      } satisfies AppointmentCreatedPayload,
      enrichedEventSource,
    );

    logger.debug(
      {
        appointmentId,
        customerName: appointment.customer.name,
        status: appointment.status,
        confirmed,
      },
      "Event created successfully",
    );

    return appointment;
  }

  public async updateAppointment(
    appointmentId: string,
    {
      event,
      confirmed: propsConfirmed,
      files,
      doNotNotifyCustomer,
      eventSource,
    }: {
      event: AppointmentEvent;
      confirmed?: boolean;
      files?: Record<string, File>;
      doNotNotifyCustomer?: boolean;
      eventSource: EventSource;
    },
  ): Promise<Appointment> {
    const logger = this.loggerFactory("updateAppointment");
    logger.debug(
      {
        event: {
          dateTime: event.dateTime,
          totalDuration: event.totalDuration,
          customerName: event.fields.name,
          customerEmail: event.fields.email,
          customerPhone: event.fields.phone,
          optionName: event.option.name,
          optionIsOnline: event.option.isOnline,
        },
        confirmed: propsConfirmed,
        fileCount: files ? Object.keys(files).length : 0,
        doNotNotifyCustomer,
      },
      "Updating event",
    );

    const appointment = await this.getAppointment(appointmentId);

    if (!appointment) {
      logger.error({ id: appointmentId }, "Appointment not found");
      throw new Error("Appointment not found");
    }

    if (isClosedAppointmentStatus(appointment.status)) {
      logger.error({ id: appointmentId }, "Appointment is closed");
      throw new Error("Appointment is closed");
    }

    const enrichedEventSource = enrichEventSourceWithCustomerId(
      eventSource,
      appointment.customerId,
    );

    const assets: Asset[] = [];
    if (files) {
      logger.debug(
        { appointmentId, fileCount: Object.keys(files).length },
        "Processing files for event",
      );

      for (const [fieldId, file] of Object.entries(files)) {
        const fileType = fileNameToMimeType(file.name);

        const asset = await this.assetsService.createAsset(
          {
            filename: `${getAppointmentBucket(appointmentId)}/${fieldId}-${file.name}`,
            mimeType: fileType,
            appointmentId,
            description: `${event.fields.name} - ${event.option.name} - ${fieldId}`,
          },
          file,
          eventSource,
        );

        assets.push(asset);
      }
    }

    const confirmed = propsConfirmed ?? appointment.status === "confirmed";

    logger.debug({ appointmentId, confirmed }, "Saving event");

    await this.updateEventInDatabase(
      appointmentId,
      event,
      appointment,
      assets.length ? assets : undefined,
      confirmed,
    );

    logger.debug({ appointmentId, confirmed }, "Event saved");

    const updatedAppointment = await this.getAppointment(appointmentId);
    if (!updatedAppointment) {
      logger.error(
        { appointmentId },
        "Something went wrong - updated appointment not found",
      );
      throw new Error("Something went wrong - updated appointment not found");
    }

    logger.debug({ appointmentId }, "Event saved, executing hooks");
    await this.eventService.emit(
      APPOINTMENT_RESCHEDULED_EVENT_TYPE,
      {
        updatedAppointment,
        dateTime: event.dateTime,
        totalDuration: event.totalDuration,
        previousDateTime: appointment.dateTime,
        previousTotalDuration: appointment.totalDuration,
        doNotNotifyCustomer,
      } satisfies AppointmentRescheduledPayload,
      enrichedEventSource,
    );

    logger.debug(
      {
        appointmentId,
        customerName: updatedAppointment.customer.name,
        status: updatedAppointment.status,
        confirmed,
      },
      "Event updated successfully",
    );

    return updatedAppointment;
  }

  public async getPendingAppointmentsCount(
    minimumDate?: Date,
    createdAfter?: Date,
    memberId?: string,
  ): Promise<{ totalCount: number; newCount: number }> {
    const logger = this.loggerFactory("getPendingAppointmentsCount");
    logger.debug(
      { minimumDate, createdAfter, memberId },
      "Getting pending appointments count",
    );

    const db = await getDbConnection();
    const filter: Filter<AppointmentEntity> = {
      status: "pending",
      dateTime: minimumDate ? { $gte: minimumDate } : undefined,
      organizationId: this.organizationId,
      ...(memberId ? { memberId } : {}),
    };

    const collection = db.collection<AppointmentEntity>(
      APPOINTMENTS_COLLECTION_NAME,
    );

    const dateMatch = createdAfter
      ? [
          {
            $match: {
              createdAt: {
                $gte: createdAfter,
              },
            },
          },
        ]
      : [];

    const [result] = await collection
      .aggregate([
        {
          $match: filter,
        },
        {
          $facet: {
            totalCount: [
              {
                $count: "count",
              },
            ],
            newCount: [
              ...dateMatch,
              {
                $count: "count",
              },
            ],
          },
        },
      ])
      .toArray();

    const response = {
      totalCount: result.totalCount?.[0]?.count || 0,
      newCount: result.newCount?.[0]?.count || 0,
    };

    logger.debug(
      { minimumDate, createdAfter, memberId, response },
      "Pending appointments count retrieved",
    );

    return response;
  }

  public async getPendingAppointments(
    limit = 20,
    after?: Date,
    memberId?: string,
  ): Promise<WithTotal<Appointment>> {
    const logger = this.loggerFactory("getPendingAppointments");
    logger.debug({ limit, after, memberId }, "Getting pending appointments");

    const db = await getDbConnection();
    const filter: Filter<Appointment> = {
      status: "pending",
      organizationId: this.organizationId,
      dateTime: after
        ? {
            $gte: after,
          }
        : undefined,
      ...(memberId ? { memberId } : {}),
    };

    const [result] = await db
      .collection<AppointmentEntity>(APPOINTMENTS_COLLECTION_NAME)
      .aggregate([
        {
          $match: filter,
        },
        {
          $sort: { dateTime: 1 },
        },
        ...this.aggregateJoin,
        {
          $facet: {
            paginatedResults: [],
            totalCount: [
              {
                $count: "count",
              },
            ],
          },
        },
      ])
      .toArray();

    const response = {
      total: result.totalCount?.[0]?.count || 0,
      items: result.paginatedResults || [],
    };

    logger.debug(
      {
        limit,
        after,
        memberId,
        result: { total: response.total, count: response.items.length },
      },
      "Pending appointments retrieved",
    );

    return response;
  }

  // public async getNextAppointments(date: Date, limit = 5) {
  //   const db = await getDbConnection();
  //   const appointments = db.collection<AppointmentEntity>(
  //     APPOINTMENTS_COLLECTION_NAME
  //   );

  //   const result = await appointments
  //     .find({
  //       dateTime: {
  //         $gte: date,
  //       },
  //       status: {
  //         $ne: "declined",
  //       },
  //     })
  //     .sort("dateTime", "ascending")
  //     .limit(limit)
  //     .toArray();

  //   return result;
  // }

  // This requires upgrade of MongoDB to at least 5.0
  public async getNextAppointments(date: Date, limit = 5, memberId?: string) {
    const logger = this.loggerFactory("getNextAppointments");
    logger.debug({ date, limit, memberId }, "Getting next appointments");

    const db = await getDbConnection();
    const appointments = db.collection<AppointmentEntity>(
      APPOINTMENTS_COLLECTION_NAME,
    );

    const result = await appointments
      .aggregate([
        ...this.aggregateJoin,
        {
          $match: {
            organizationId: this.organizationId,
            endAt: {
              $gte: date,
            },
            status: openAppointmentStatusMongoFilter,
            ...(memberId ? { memberId } : {}),
          },
        },
        {
          $sort: {
            dateTime: 1,
          },
        },
        { $limit: limit },
      ])
      .toArray();

    logger.debug(
      { date, limit, memberId, count: result.length },
      "Next appointments retrieved",
    );

    return result as Appointment[];
  }

  public getAppointments(
    query: Query & GetAppointmentsQueryWithReferenceDate,
  ): Promise<WithTotal<AppointmentWithReferenceDateDistance>>;
  public getAppointments(
    query: Query & GetAppointmentsQuery,
  ): Promise<WithTotal<Appointment>>;
  public async getAppointments(
    query: Query & GetAppointmentsQuery,
  ): Promise<WithTotal<Appointment | AppointmentWithReferenceDateDistance>> {
    const logger = this.loggerFactory("getAppointments");
    logger.info({ query }, "Getting appointments");

    const db = await getDbConnection();

    const sort: Sort = query.sort?.reduce((prev, curr) => {
      if (curr.id === "referenceDateDistanceMs" && !query.referenceDate) {
        return prev;
      }

      return {
        ...prev,
        [curr.id]: curr.desc ? -1 : 1,
      };
    }, {}) || { dateTime: -1 };

    const filter: Filter<Appointment> = { organizationId: this.organizationId };
    if (query.range?.start || query.range?.end) {
      filter.dateTime = {};

      if (query.range.start) {
        filter.dateTime.$gte = query.range.start;
      }

      if (query.range.end) {
        filter.dateTime.$lte = query.range.end;
      }
    }

    if (query.endRange?.start || query.endRange?.end) {
      filter.endAt = {};
      if (query.endRange.start) {
        filter.endAt.$gte = query.endRange.start;
      }

      if (query.endRange.end) {
        filter.endAt.$lte = query.endRange.end;
      }
    }

    if (query.status && query.status.length) {
      filter.status = {
        $in: query.status,
      };
    }

    if (query.customerId) {
      filter.customerId = {
        $in: Array.isArray(query.customerId)
          ? query.customerId
          : [query.customerId],
      };
    }

    if (query.memberId) {
      filter.memberId = {
        $in: Array.isArray(query.memberId) ? query.memberId : [query.memberId],
      };
    }

    if (query.optionId) {
      filter["option._id"] = {
        $in: Array.isArray(query.optionId) ? query.optionId : [query.optionId],
      };
    }

    if (query.discountId) {
      filter["discount.id"] = {
        $in: Array.isArray(query.discountId)
          ? query.discountId
          : [query.discountId],
      };
    }

    if (query.customerPackageId) {
      filter["packageUsage.customerPackageId"] = query.customerPackageId;
    }

    if (query.packageId) {
      filter["customerPackage.packageId"] = {
        $in: Array.isArray(query.packageId)
          ? query.packageId
          : [query.packageId],
      };
    }

    if (query.search) {
      const $regex = new RegExp(escapeRegex(query.search), "i");
      const queries = buildSearchQuery<Appointment>(
        { $regex },
        "option.name",
        "note",
        "addons.name",
        "addons.description",
        // @ts-ignore value
        "fields.v",
      );

      filter.$or = queries;
    }

    const pipeline: Document[] = [
      {
        $addFields: {
          fields: {
            $objectToArray: "$fields",
          },
        },
      },
      ...this.aggregateJoin,
      {
        $match: filter,
      },
    ];

    if (query.referenceDate) {
      pipeline.push({
        $addFields: {
          referenceDateDistanceMs: {
            $abs: {
              $subtract: ["$endAt", query.referenceDate],
            },
          },
        },
      });
    }

    pipeline.push(
      {
        $sort: sort,
      },
      {
        $addFields: {
          fields: {
            $arrayToObject: "$fields",
          },
        },
      },
      {
        $facet: {
          paginatedResults:
            query.limit === 0
              ? undefined
              : [
                  ...(typeof query.offset !== "undefined"
                    ? [{ $skip: query.offset }]
                    : []),
                  ...(typeof query.limit !== "undefined"
                    ? [{ $limit: query.limit }]
                    : []),
                ],
          totalCount: [
            {
              $count: "count",
            },
          ],
        },
      },
    );

    const [result] = await db
      .collection<AppointmentEntity>(APPOINTMENTS_COLLECTION_NAME)
      .aggregate(pipeline)
      .toArray();

    const response = {
      total: result.totalCount?.[0]?.count || 0,
      items: result.paginatedResults || [],
    };

    logger.info(
      {
        result: { total: response.total, count: response.items.length },
        query,
      },
      "Fetched appointments",
    );

    return response;
  }

  public async getCalendarEvents(
    start: Date,
    end: Date,
    status: AppointmentStatus[],
    memberId?: string,
  ): Promise<CalendarEvent[]> {
    const logger = this.loggerFactory("getCalendarEvents");
    logger.debug({ start, end, status, memberId }, "Getting events");

    const appointments = await this.getAppointments({
      range: {
        start,
        end,
      },
      status,
      memberId,
    });

    const config = await this.configurationService.getConfiguration("booking");

    const membersAndCalendarSourceAppIds =
      await this.getMembersAndCalendarSourceAppIds(config, memberId);

    const appIdsMap = membersAndCalendarSourceAppIds.reduce(
      (map, m) => {
        m.appIds.forEach((appId) => {
          map[appId] = m.member;
        });
        return map;
      },
      {} as Record<string, OrganizationMember>,
    );

    const apps = await this.appsService.getAppsData(Object.keys(appIdsMap));

    const url = getAdminUrl();
    const skipUids = new Set(
      appointments.items.map((app) => getIcsEventUid(app._id, url)),
    );

    logger.debug(
      { appCount: apps.length },
      "Getting busy times from calendar apps",
    );

    const appsPromises = apps.map(async (app) => {
      const service = AvailableAppServices[app.name](
        this.appsService.getAppServiceProps(app._id),
      ) as any as ICalendarBusyTimeProvider;

      return {
        appId: app._id,
        member: appIdsMap[app._id],
        busyTimes: await service.getBusyTimes(app, start, end, memberId),
      };
    });

    const appsResponse = await Promise.all(appsPromises);
    const appsEvents: CalendarEvent[] = appsResponse
      .flatMap((app) =>
        app.busyTimes.map((event) => ({
          title: event.title || "Busy",
          dateTime: event.startAt,
          memberId: app.member._id,
          totalDuration: DateTime.fromJSDate(event.endAt).diff(
            DateTime.fromJSDate(event.startAt),
            "minutes",
          ).minutes,
          uid: event.uid,
          member: omit(app.member, ["calendarSources"]),
        })),
      )
      .filter((event) => !skipUids.has(event.uid));

    const result = [...appointments.items, ...appsEvents];

    logger.debug(
      {
        start,
        end,
        status,
        appointmentCount: appointments.items.length,
        appEventCount: appsEvents.length,
        totalEventCount: result.length,
      },
      "Events retrieved",
    );

    return result;
  }

  public async getAppointment(id: string): Promise<Appointment | null> {
    const logger = this.loggerFactory("getAppointment");
    logger.debug({ appointmentId: id }, "Getting appointment by id");

    const db = await getDbConnection();
    const appointments = db.collection<AppointmentEntity>(
      APPOINTMENTS_COLLECTION_NAME,
    );

    const result = await appointments
      .aggregate([
        {
          $match: {
            _id: id,
            organizationId: this.organizationId,
          },
        },
        ...this.aggregateJoin,
      ])
      .next();

    if (!result) {
      logger.warn({ appointmentId: id }, "Appointment not found");
    } else {
      logger.debug(
        {
          appointmentId: id,
          customerName: result.customer?.name,
          status: result.status,
        },
        "Appointment found",
      );
    }

    return result as Appointment | null;
  }

  public async findAppointmentByCustomerAndDateTime(
    customerId: string,
    dateTime: Date,
    status?: AppointmentStatus[],
  ): Promise<Appointment | null> {
    const logger = this.loggerFactory("findAppointmentByCustomerAndDateTime");
    logger.debug({ customerId, dateTime }, "Finding appointment");

    const db = await getDbConnection();
    const appointments = db.collection<AppointmentEntity>(
      APPOINTMENTS_COLLECTION_NAME,
    );

    const dateTimeLuxon = DateTime.fromJSDate(dateTime);

    const filter: Filter<Appointment>[] = [
      {
        organizationId: this.organizationId,
        customerId,
        dateTime: {
          $gte: dateTimeLuxon.startOf("minute").toJSDate(),
          $lte: dateTimeLuxon.endOf("minute").toJSDate(),
        },
      },
    ];

    if (status && status.length) {
      filter.push({
        status: {
          $in: status,
        },
      });
    }

    const result = await appointments
      .aggregate([
        {
          $match: {
            $and: filter,
          },
        },
        ...this.aggregateJoin,
      ])
      .next();

    if (!result) {
      logger.warn({ customerId, dateTime }, "Appointment not found");
    } else {
      logger.debug(
        {
          appointmentId: result._id,
          customerName: result.customer?.name,
          status: result.status,
        },
        "Appointment found",
      );
    }

    return result as Appointment | null;
  }

  public async changeAppointmentStatus(
    id: string,
    newStatus: AppointmentStatus,
    eventSource: EventSource,
    doNotNotifyCustomer?: boolean,
  ) {
    const logger = this.loggerFactory("changeAppointmentStatus");
    logger.debug(
      { appointmentId: id, newStatus, doNotNotifyCustomer },
      "Changing appointment status",
    );

    const appointment = await this.getAppointment(id);

    if (!appointment) {
      logger.warn(
        { appointmentId: id },
        "Appointment not found for status change",
      );
      return;
    }
    const oldStatus = appointment.status;

    if (oldStatus === newStatus) {
      logger.debug(
        { appointmentId: id, status: oldStatus },
        "Appointment status unchanged",
      );
      return;
    }

    const enrichedEventSource = enrichEventSourceWithCustomerId(
      eventSource,
      appointment.customerId,
    );

    const db = await getDbConnection();
    await db
      .collection<AppointmentEntity>(APPOINTMENTS_COLLECTION_NAME)
      .updateOne(
        {
          _id: id,
          organizationId: this.organizationId,
        },
        {
          $set: {
            status: newStatus,
          },
        },
      );

    logger.debug(
      { appointmentId: id, oldStatus, newStatus },
      "Appointment status changed",
    );

    appointment.status = newStatus;

    if (
      (newStatus === "canceled" || newStatus === "declined") &&
      (oldStatus === "pending" || oldStatus === "confirmed")
    ) {
      await this.packagesService.restoreForAppointment({
        appointmentId: id,
        source: enrichedEventSource,
      });
    }

    await this.addAppointmentHistory({
      appointmentId: id,
      type: "statusChanged",
      data: {
        oldStatus,
        newStatus,
        ...historyActorFields(enrichedEventSource),
      },
    });

    await this.eventService.emit(
      APPOINTMENT_STATUS_CHANGED_EVENT_TYPE,
      {
        appointment,
        newStatus,
        oldStatus,
        doNotNotifyCustomer,
      } satisfies AppointmentStatusChangedPayload,
      enrichedEventSource,
    );

    logger.debug(
      { appointmentId: id, oldStatus, newStatus },
      "Appointment status changed successfully",
    );
  }

  public async updateAppointmentNote(id: string, note?: string) {
    const logger = this.loggerFactory("updateAppointmentNote");
    logger.debug(
      { appointmentId: id, noteLength: note?.length },
      "Updating appointment note",
    );

    const db = await getDbConnection();

    await db
      .collection<AppointmentEntity>(APPOINTMENTS_COLLECTION_NAME)
      .updateOne(
        {
          _id: id,
          organizationId: this.organizationId,
        },
        {
          $set: {
            note: note,
          },
        },
      );

    logger.debug(
      { appointmentId: id },
      "Appointment note updated successfully",
    );
  }

  public async addAppointmentFiles(
    appointmentId: string,
    files: File[],
    source: EventSource,
  ): Promise<Asset[]> {
    const logger = this.loggerFactory("addAppointmentFiles");
    logger.debug(
      { appointmentId, fileCount: files.length },
      "Adding files to appointment",
    );

    const db = await getDbConnection();
    const event = await db
      .collection<AppointmentEntity>(APPOINTMENTS_COLLECTION_NAME)
      .findOne({
        _id: appointmentId,
        organizationId: this.organizationId,
      });

    if (!event) {
      logger.warn({ appointmentId }, "Appointment not found for file addition");
      return [];
    }

    const assets: Asset[] = [];
    if (files) {
      for (const file of files) {
        const fileType = fileNameToMimeType(file.name);

        logger.debug(
          { appointmentId, fileName: file.name, fileType },
          "Adding file to appointment",
        );

        const id = v4();
        const asset = await this.assetsService.createAsset(
          {
            filename: `${getAppointmentBucket(appointmentId)}/${id}-${file.name}`,
            mimeType: fileType,
            appointmentId,
            description: `${event.fields.name} - ${event.option.name}`,
          },
          file,
          source,
        );

        assets.push({ ...asset, appointment: event });
      }
    }

    logger.debug(
      { appointmentId, fileCount: files.length, assetCount: assets.length },
      "Files added to appointment successfully",
    );

    return assets;
  }

  public async rescheduleAppointment(
    id: string,
    newTime: Date,
    newDuration: number,
    eventSource: EventSource,
    doNotNotifyCustomer?: boolean,
  ) {
    const logger = this.loggerFactory("rescheduleAppointment");
    logger.debug(
      { appointmentId: id, newTime, newDuration, doNotNotifyCustomer },
      "Rescheduling appointment",
    );

    const appointment = await this.getAppointment(id);

    if (!appointment) {
      logger.warn(
        { appointmentId: id },
        "Appointment not found for rescheduling",
      );
      return;
    }

    const oldTime = appointment.dateTime;
    const oldDuration = appointment.totalDuration;
    const enrichedEventSource = enrichEventSourceWithCustomerId(
      eventSource,
      appointment.customerId,
    );

    const db = await getDbConnection();
    await db
      .collection<AppointmentEntity>(APPOINTMENTS_COLLECTION_NAME)
      .updateOne(
        {
          _id: id,
          organizationId: this.organizationId,
        },
        {
          $set: {
            dateTime: newTime,
            totalDuration: newDuration,
          },
        },
      );

    await this.addAppointmentHistory({
      appointmentId: id,
      type: "rescheduled",
      data: {
        oldDateTime: oldTime,
        newDateTime: newTime,
        ...historyActorFields(enrichedEventSource),
      },
    });

    logger.debug(
      { appointmentId: id, newTime, newDuration },
      "Appointment rescheduled in db",
    );

    logger.debug(
      { appointmentId: id, newTime, newDuration },
      "Appointment rescheduled in db",
    );

    await this.eventService.emit(
      APPOINTMENT_SLOT_RESCHEDULED_EVENT_TYPE,
      {
        appointment,
        newTime,
        newDuration,
        oldTime,
        oldDuration,
        doNotNotifyCustomer,
      } satisfies AppointmentSlotRescheduledPayload,
      enrichedEventSource,
    );

    logger.debug(
      {
        appointmentId: id,
        oldTime,
        newTime,
        oldDuration,
        newDuration,
      },
      "Appointment rescheduled successfully",
    );
  }

  public async getAppointmentHistory(
    query: Query & {
      appointmentId: string;
      type?: AppointmentHistoryEntry["type"];
    },
  ): Promise<WithTotal<AppointmentHistoryEntry>> {
    const logger = this.loggerFactory("getAppointmentHistory");
    logger.debug({ query }, "Getting appointment history");

    const sort: Sort = query.sort?.reduce(
      (prev, curr) => ({
        ...prev,
        [curr.id]: curr.desc ? -1 : 1,
      }),
      {},
    ) || { dateTime: -1 };

    const filter: Filter<AppointmentHistoryEntry> = {
      organizationId: this.organizationId,
    };

    if (query.appointmentId) {
      filter.appointmentId = query.appointmentId;
    }

    if (query.type) {
      filter.type = query.type;
    }

    if (query.search) {
      const $regex = new RegExp(escapeRegex(query.search), "i");
      const queries = buildSearchQuery<AppointmentHistoryEntry>(
        { $regex },
        "type",
      );

      filter.$or = queries;
    }

    const db = await getDbConnection();

    const [result] = await db
      .collection<AppointmentHistoryEntry>(APPOINTMENTS_HISTORY_COLLECTION_NAME)
      .aggregate([
        { $match: filter },
        { $sort: sort },
        {
          $facet: {
            paginatedResults:
              query.limit === 0
                ? undefined
                : [
                    ...(typeof query.offset !== "undefined"
                      ? [{ $skip: query.offset }]
                      : []),
                    ...(typeof query.limit !== "undefined"
                      ? [{ $limit: query.limit }]
                      : []),
                  ],
            totalCount: [
              {
                $count: "count",
              },
            ],
          },
        },
      ])
      .toArray();

    const response = {
      total: result.totalCount?.[0]?.count || 0,
      items: result.paginatedResults || [],
    };

    logger.debug(
      { total: response.total, items: response.items.length },
      "Appointment history retrieved",
    );

    return response;
  }

  public async addAppointmentHistory(
    entry: Omit<AppointmentHistoryEntry, "_id" | "dateTime" | "organizationId">,
  ): Promise<string> {
    const logger = this.loggerFactory("addAppointmentHistory");
    logger.debug({ entry }, "Adding appointment history");

    const db = await getDbConnection();
    const historyEntry = {
      ...entry,
      _id: new ObjectId().toString(),
      dateTime: new Date(),
      organizationId: this.organizationId,
    } as AppointmentHistoryEntry;

    await db
      .collection<AppointmentHistoryEntry>(APPOINTMENTS_HISTORY_COLLECTION_NAME)
      .insertOne(historyEntry);

    logger.debug({ historyEntry }, "Appointment history added");

    return historyEntry._id;
  }

  public async verifyTimeAvailability(
    dateTime: Date,
    duration: number,
    memberId: string,
    propConfig?: BookingConfiguration,
    propGeneralConfig?: GeneralConfiguration,
  ): Promise<boolean> {
    const logger = this.loggerFactory("verifyTimeAvailability");
    logger.debug(
      { dateTime, duration, memberId },
      "Verifying time availability",
    );

    const config =
      propConfig ||
      (await this.configurationService.getConfiguration("booking"));
    const generalConfig =
      propGeneralConfig ||
      (await this.configurationService.getConfiguration("general"));

    const eventTime = DateTime.fromJSDate(dateTime, {
      zone: "utc",
    }).setZone(generalConfig.timeZone);

    const earliestBookable = DateTime.now().plus({
      hours: config.minHoursBeforeBooking || 0,
    });

    if (eventTime < earliestBookable) {
      logger.warn(
        { eventTime, earliestBookable },
        "Event time is before minHoursBeforeBooking",
      );

      return false;
    }

    const start = eventTime.startOf("day");
    const end = start.endOf("day");

    const events = await this.getBusyTimes(start, end, config, memberId);

    const schedule = await this.scheduleService.getSchedule(
      start.toJSDate(),
      end.toJSDate(),
      memberId,
    );

    const availability = await this.getAvailableTimes(
      start,
      end,
      duration,
      events,
      config,
      generalConfig,
      schedule,
    );

    if (!availability.find((time) => time.getTime() === eventTime.toMillis())) {
      logger.warn(
        { eventTime, availability, start, end },
        "Event time is not available",
      );

      return false;
    }

    return true;
  }

  public async getAppointmentOptions(opts?: {
    customerId?: string;
  }): Promise<GetAppointmentOptionsResponse> {
    const logger = this.loggerFactory("getAppointmentOptions");

    logger.debug("Processing getting booking options API request");

    const config = await this.configurationService.getConfiguration("booking");

    logger.debug({ config }, "Booking configuration");

    const [fields, addons, options, publicPackages, hasActiveCustomerPackages] =
      await Promise.all([
        this.servicesService.getFields({}),
        this.servicesService.getAddons({}),
        this.servicesService.getOptions({}),
        this.packagesService.getPublicPackages(),
        this.packagesService.hasActiveCustomerPackages(),
      ]);

    const configFields = (fields?.items || []).reduce(
      (map, field) => ({
        ...map,
        [field._id]: field,
      }),
      {} as Record<string, FieldSchema>,
    );

    const catalogOptionIds = flattenCatalogOptionIds(config.catalog);
    const catalogPackageIds = new Set(flattenCatalogPackageIds(config.catalog));
    const packageItemOptionIds = publicPackages
      .filter((pkg) => catalogPackageIds.has(pkg._id))
      .flatMap((pkg) => pkg.items.map((item) => item.optionId));

    let customerPackageOptionIds: string[] = [];
    if (opts?.customerId) {
      const { items: customerPackages } =
        await this.packagesService.getCustomerPackages({
          customerId: opts.customerId,
          status: ["active"],
          offset: 0,
          limit: 100,
        });
      customerPackageOptionIds = [
        ...new Set(
          customerPackages.flatMap((pkg) =>
            pkg.items
              .filter((item) => (pkg.remainingByItem[item._id] ?? 0) > 0)
              .map((item) => item.optionId),
          ),
        ),
      ];
    }

    const optionIds = [
      ...new Set([
        ...catalogOptionIds,
        ...packageItemOptionIds,
        ...customerPackageOptionIds,
      ]),
    ];
    const optionsChoices = optionIds
      .map((id) => options.items?.find(({ _id }) => id == _id))
      .filter((o) => !!o);

    const activeMembers = await this.teamService.getActiveMembers();
    const members: PublicStaffMember[] = activeMembers.map((member) => ({
      id: String(member._id),
      name: member.name || member.email || "",
      bio: member.bio,
      image: member.image,
    }));

    // Services with no assigned members are not bookable.
    const bookableOptions = optionsChoices.filter((option) => {
      const basePrice =
        option.durationType === "fixed" ? option.price : option.pricePerHour;
      const baseDuration =
        option.durationType === "fixed" ? option.duration : undefined;

      return (
        getActiveStaffForAssignments(
          option.staff,
          members,
          basePrice,
          baseDuration,
        ).length > 0
      );
    });

    const choices: AppointmentChoice[] = bookableOptions.map((option) => {
      const addonsFiltered =
        option.addons
          ?.map((o) => addons.items?.find((x) => x._id === o.id))
          .filter((f) => !!f) || [];

      const optionFields = option.fields || [];

      const fieldsIdsRequired = [...optionFields].reduce(
        (map, field) => ({
          ...map,
          [field.id]: !!map[field.id] || !!field.required,
        }),
        {} as Record<string, boolean>,
      );

      const fields = Object.entries(fieldsIdsRequired)
        .filter(([id]) => !!configFields[id])
        .map(([id, required]) => ({
          ...configFields[id],
          required: !!configFields[id].required || required,
          id: id,
        }));

      return {
        ...option,
        addons: addonsFiltered,
        fields,
      };
    });

    let showPromoCode = false;
    if (config.allowPromoCode === "always") showPromoCode = true;
    else if (config.allowPromoCode === "allow-if-has-active") {
      const hasActiveDiscounts = await this.servicesService.hasActiveDiscounts(
        new Date(),
      );
      if (hasActiveDiscounts) showPromoCode = true;
    }

    const bookingRestriction = await this.getFreeTierBookingRestriction();
    const bookableOptionIds = new Set(choices.map((choice) => choice._id));
    const publicPackageIds = new Set(publicPackages.map((pkg) => pkg._id));
    const catalogSource = config.catalog ?? [];

    const filterCatalog = (nodes: BookingCatalogNode[]): BookingCatalogNode[] =>
      nodes
        .map((node) => {
          if (node.type === "group") {
            const children = filterCatalog(node.children);
            return children.length ? { ...node, children } : null;
          }
          if (node.type === "option") {
            return bookableOptionIds.has(node.optionId) ? node : null;
          }
          return publicPackageIds.has(node.packageId) ? node : null;
        })
        .filter((node): node is BookingCatalogNode => node !== null);

    const response: GetAppointmentOptionsResponse = {
      options: choices,
      fieldsSchema: configFields,
      showPromoCode: showPromoCode,
      bookingRestriction,
      members,
      catalog: filterCatalog(catalogSource),
      packages: publicPackages.filter((pkg) =>
        pkg.items.some((item) => bookableOptionIds.has(item.optionId)),
      ),
      requireCustomerOtp: !!config.requireCustomerOtp,
      hasActiveCustomerPackages,
    };

    return response;
  }

  private async getAvailableTimes(
    start: DateTime,
    end: DateTime,
    duration: number,
    events: Period[],
    config: BookingConfiguration,
    generalConfig: GeneralConfiguration,
    schedule: Record<string, DaySchedule>,
  ) {
    const logger = this.loggerFactory("getAvailableTimes");
    let results: TimeSlot[];

    if (config.availabilityProviderAppId) {
      logger.debug(
        { availabilityProviderAppId: config.availabilityProviderAppId },
        "Getting available time slots from availability provider",
      );

      const { service, app } =
        await this.appsService.getAppService<IAvailabilityProvider>(
          config.availabilityProviderAppId,
        );

      const availability = await service.getAvailability(
        app,
        start.toJSDate(),
        end.toJSDate(),
        duration,
        events,
        schedule,
      );

      logger.debug(
        { availability: availability.length },
        "Availability retrieved from availability provider",
      );

      results = availability;
    } else {
      const customSlots = config.customSlotTimes?.map((x) => parseTime(x));

      logger.debug(
        { start, end, duration, events, config, schedule },
        "Getting available time slots in calendar using default method",
      );

      results = getAvailableTimeSlotsInCalendar({
        calendarEvents: events.map((event) => ({
          ...event,
          startAt: DateTime.fromJSDate(event.startAt),
          endAt: DateTime.fromJSDate(event.endAt),
        })),
        configuration: {
          timeSlotDuration: duration,
          schedule,
          timeZone: generalConfig.timeZone || DateTime.now().zoneName!,
          minAvailableTimeAfterSlot: config.breakDuration ?? 0,
          minAvailableTimeBeforeSlot: config.breakDuration ?? 0,
          slotStart: config.slotStart ?? 15,
          customSlots,
        },
        from: start.toJSDate(),
        to: end.toJSDate(),
      });
    }

    logger.debug(
      { start, end, duration, results: results.length },
      "Available time slots retrieved",
    );

    return results.map((x) => x.startAt);
  }

  private async getBusyTimes(
    start: DateTime,
    end: DateTime,
    config: BookingConfiguration,
    memberId?: string,
  ) {
    const logger = this.loggerFactory("getBusyTimes");

    logger.debug({ start, end, memberId }, "Getting busy times");

    const url = getAdminUrl();
    const closedAppointments = await this.getDbClosedEventIds(start, end);
    const closedUids = new Set(
      closedAppointments.map((id) => getIcsEventUid(id, url)),
    );

    logger.debug(
      { start, end, closedAppointments, closedUids },
      "Closed appointments retrieved",
    );

    const membersAndCalendarSourceAppIds =
      await this.getMembersAndCalendarSourceAppIds(config, memberId);

    if (!membersAndCalendarSourceAppIds.length) {
      logger.debug(
        { start, end, memberId },
        "No calendar sources allowed or configured; using DB busy times only",
      );
    }

    const appIds = membersAndCalendarSourceAppIds.map((m) => m.appIds).flat();

    const apps = await this.appsService.getAppsData(appIds);

    const dbEventsPromise = this.getDbBusyTimes(start, end, memberId);
    const appsPromises = apps.map(async (app) => {
      logger.debug(
        { appId: app._id, appName: app.name, start, end },
        "Getting busy times from app",
      );

      const service = AvailableAppServices[app.name](
        this.appsService.getAppServiceProps(app._id),
      ) as any as ICalendarBusyTimeProvider;

      return service.getBusyTimes(
        app,
        start.toJSDate(),
        end.toJSDate(),
        memberId,
      );
    });

    const [dbEvents, ...appsEvents] = await Promise.all([
      dbEventsPromise,
      ...appsPromises,
    ]);

    logger.debug(
      {
        start,
        end,
        dbEvents: dbEvents.length,
        appsEvents: appsEvents.flat().length,
      },
      "Busy times retrieved",
    );

    const remoteEvents = appsEvents
      .flat()
      .filter((event) => !closedUids.has(event.uid))
      .map(
        (event) =>
          ({
            startAt: event.startAt,
            endAt: event.endAt,
          }) satisfies Period,
      );

    logger.debug(
      {
        start,
        end,
        remoteEvents: remoteEvents.length,
        dbEvents: dbEvents.length,
        total: remoteEvents.length + dbEvents.length,
      },
      "Busy times retrieved",
    );

    return [...dbEvents, ...remoteEvents];
  }

  private async getMemberCalendarSourceAppIds(
    memberId: string,
  ): Promise<{ appIds: string[] | undefined; role: string | undefined }> {
    const db = await getDbConnection();
    const member = await db
      .collection<OrganizationMember>(MEMBERS_COLLECTION_NAME)
      .findOne({
        _id: memberId as unknown as OrganizationMember["_id"],
        organizationId: this.organizationId,
      });

    if (!member) {
      return { appIds: undefined, role: undefined };
    }

    return {
      role: member.role,
      appIds: member.calendarSources?.length
        ? member.calendarSources.map((source) => source.appId)
        : undefined,
    };
  }

  private async resolveDefaultMemberId(): Promise<string> {
    const logger = this.loggerFactory("resolveDefaultMemberId");
    const db = await getDbConnection();
    const owner = await db
      .collection<OrganizationMember>(MEMBERS_COLLECTION_NAME)
      .findOne({ organizationId: this.organizationId, role: "owner" });

    if (owner) {
      return String(owner._id);
    }

    // Backward-compatible fallback while existing workspaces are migrated to members.
    logger.warn(
      { organizationId: this.organizationId },
      "No owner member found, falling back to first admin user for memberId resolution",
    );
    const contacts = await this.teamService.getOrganizationAdminContacts();
    return contacts[0]?.memberId ?? "";
  }

  private async getMembersAndCalendarSourceAppIds(
    config: BookingConfiguration,
    memberId?: string,
  ): Promise<{ member: OrganizationMember; appIds: string[] }[]> {
    if (memberId) {
      const member = await this.teamService.getMemberById(memberId);
      if (!member) {
        return [];
      }

      if (
        !canUseMemberCalendarSources(member.role, {
          allowStaffCalendarSources: config.allowStaffCalendarSources,
        })
      ) {
        return [];
      }

      return [
        {
          member,
          appIds: member.calendarSources?.map((source) => source.appId) ?? [],
        },
      ];
    }

    const members = await this.teamService.getActiveMembers();
    const appIds: { member: OrganizationMember; appIds: string[] }[] = [];

    for (const member of members) {
      if (
        !canUseMemberCalendarSources(member.role, {
          allowStaffCalendarSources: config.allowStaffCalendarSources,
        })
      ) {
        continue;
      }

      appIds.push({
        member,
        appIds: member.calendarSources?.map((source) => source.appId) ?? [],
      });
    }

    return appIds;
  }

  private async getDbBusyTimes(
    start: DateTime,
    end: DateTime,
    memberId?: string,
  ): Promise<Period[]> {
    const logger = this.loggerFactory("getDbBusyTimes");

    const db = await getDbConnection();
    logger.debug({ start, end, memberId }, "Getting busy times from db");

    const events = await db
      .collection<AppointmentEntity>(APPOINTMENTS_COLLECTION_NAME)
      .find({
        organizationId: this.organizationId,
        dateTime: {
          $gte: start.minus({ days: 1 }).toJSDate(),
          $lte: end.plus({ days: 1 }).toJSDate(),
        },
        status: openAppointmentStatusMongoFilter,
        ...(memberId ? { memberId } : {}),
      })
      .map(({ totalDuration: duration, dateTime }) => {
        return {
          duration,
          dateTime,
        };
      })
      .toArray();

    logger.debug(
      { start, end, events: events.length },
      "Busy times retrieved from db",
    );

    return events.map((x) => ({
      startAt: DateTime.fromJSDate(x.dateTime, { zone: "utc" }).toJSDate(),
      endAt: DateTime.fromJSDate(x.dateTime, { zone: "utc" })
        .plus({
          minutes: x.duration,
        })
        .toJSDate(),
    }));
  }

  private async getDbClosedEventIds(
    start: DateTime,
    end: DateTime,
  ): Promise<string[]> {
    const logger = this.loggerFactory("getDbClosedEventIds");

    const db = await getDbConnection();
    logger.debug({ start, end }, "Getting closed event ids from db");

    const ids = await db
      .collection<AppointmentEntity>(APPOINTMENTS_COLLECTION_NAME)
      .find({
        organizationId: this.organizationId,
        dateTime: {
          $gte: start.minus({ days: 1 }).toJSDate(),
          $lte: end.plus({ days: 1 }).toJSDate(),
        },
        status: closedAppointmentStatusMongoFilter,
      })
      .map(({ _id }) => _id)
      .toArray();

    logger.debug(
      { start, end, ids: ids.length },
      "Closed event ids retrieved from db",
    );

    return ids;
  }

  private async saveEvent(
    id: string,
    event: AppointmentEvent,
    eventSource: EventSource,
    customer: Customer,
    memberId: string,
    files?: Asset[],
    paymentIntentId?: string,
    meetingInformation?: AppointmentOnlineMeetingInformation,
    status: AppointmentStatus = "pending",
    force?: boolean,
    giftCards?: ApplyGiftCardsSuccessResponse["giftCards"],
    customerPackageId?: string,
    purchasePackageId?: string,
  ): Promise<Appointment> {
    const logger = this.loggerFactory("saveEvent");

    logger.debug(
      {
        appointmentId: id,
        customerName: event.fields.name,
        status,
        fileCount: files?.length || 0,
        paymentIntentId,
        force,
        giftCardsLength: giftCards?.length ?? 0,
        memberId,
      },
      "Saving event",
    );

    const db = await getDbConnection();
    const client = await getDbClient();
    const session = client.startSession();
    try {
      // return await session.withTransaction(async () => {
      const member = await this.teamService.getMemberById(memberId);

      if (!member) {
        logger.error({ memberId }, "Member not found");
        throw new Error(`Member ${memberId} was not found`);
      }

      const appointments = db.collection<AppointmentEntity>(
        APPOINTMENTS_COLLECTION_NAME,
      );

      const dbEvent: AppointmentEntity = {
        _id: id,
        organizationId: this.organizationId,
        ...event,
        memberId,
        meetingInformation,
        dateTime: DateTime.fromJSDate(event.dateTime)
          .startOf("minute")
          .toJSDate(),
        status,
        createdAt: DateTime.now().toJSDate(),
        customerId: customer._id,
      };

      let redeemPackageId = customerPackageId;
      if (purchasePackageId) {
        let packagePaymentId: string | undefined;
        if (paymentIntentId) {
          logger.debug(
            { appointmentId: id, paymentIntentId, purchasePackageId },
            "Recording package purchase payment",
          );

          const {
            amount,
            appId,
            appName,
            _id: intentId,
            paidAt,
            externalId,
            data,
            status,
            fees,
          } = await this.paymentsService.updateIntent(paymentIntentId, {
            customerId: customer._id,
          });

          if (status === "paid") {
            const pkg =
              await this.packagesService.getPackage(purchasePackageId);
            const payment = await this.paymentsService.createPayment(
              {
                appId,
                appName,
                amount,
                intentId,
                paidAt: paidAt ?? new Date(),
                customerId: customer._id,
                description: pkg?.name ?? "package",
                status: "paid",
                method: "online",
                type: "payment",
                externalId: externalId,
                data: data,
                fees,
              },
              eventSource,
            );
            packagePaymentId = payment._id;
          } else {
            logger.warn(
              { appointmentId: id, paymentIntentId, amount, status },
              "Package payment intent is not paid. Skipping it",
            );
          }
        }

        const issued = paymentIntentId
          ? await this.packagesService.issueFromPayment({
              paymentIntentId,
              packageId: purchasePackageId,
              customerId: customer._id,
              channel: "customer",
              source: eventSource,
              paymentId: packagePaymentId,
              session,
            })
          : await this.packagesService.issue({
              packageId: purchasePackageId,
              customerId: customer._id,
              channel: "customer",
              source: eventSource,
              session,
            });
        redeemPackageId = issued._id;
      }

      if (redeemPackageId) {
        const option = await this.servicesService.getOption(event.option._id);
        const optionStaffMemberIds = (option?.staff ?? []).map(
          (assignment) => assignment.memberId,
        );
        dbEvent.packageUsage = await this.packagesService.redeem({
          customerPackageId: redeemPackageId,
          appointmentId: id,
          optionId: event.option._id,
          memberId,
          appointmentDate: event.dateTime,
          optionStaffMemberIds,
          source: eventSource,
          session,
        });
      }

      await appointments.insertOne(dbEvent);

      let payments: Payment[] = [];
      if (paymentIntentId && !purchasePackageId && !customerPackageId) {
        logger.debug(
          { appointmentId: id, paymentIntentId },
          "Processing payment for appointment",
        );

        const {
          amount,
          appId,
          appName,
          _id: intentId,
          paidAt,
          externalId,
          data,
          status,
          fees,
        } = await this.paymentsService.updateIntent(paymentIntentId, {
          appointmentId: id,
          customerId: customer._id,
        });

        if (status === "paid") {
          logger.debug(
            { appointmentId: id, paymentIntentId, amount },
            "Payment intent is paid, adding to payments",
          );

          const payment = await this.paymentsService.createPayment(
            {
              appId,
              appName,
              amount,
              intentId,
              paidAt: paidAt ?? new Date(),
              appointmentId: id,
              customerId: customer._id,
              description:
                amount === event.totalPrice ? "full_payment" : "deposit",
              status: "paid",
              method: "online",
              type: "deposit",
              externalId: externalId,
              data: data,
              fees,
            },
            eventSource,
          );

          payments.push(payment);
        } else {
          logger.warn(
            { appointmentId: id, paymentIntentId, amount, status },
            "Payment intent is not paid. Skipping it",
          );
        }

        logger.debug(
          {
            appointmentId: id,
            paymentAmount: amount,
            paymentType:
              amount === event.totalPrice ? "full_payment" : "deposit",
          },
          "Payment processed for appointment",
        );
      }

      if (giftCards) {
        for (const giftCard of giftCards) {
          const payment = await this.paymentsService.createPayment(
            {
              amount: giftCard.appliedAmount,
              status: "paid",
              paidAt: new Date(),
              customerId: customer._id,
              description: "giftCard",
              ...(purchasePackageId || customerPackageId
                ? {}
                : { appointmentId: id }),
              type: "payment",
              method: "gift-card",
              giftCardCode: giftCard.code,
              giftCardId: giftCard.id,
            },
            eventSource,
          );

          if (!purchasePackageId && !customerPackageId) {
            payments.push(payment);
          }
        }
      }

      const result = {
        ...dbEvent,
        customer,
        member,
        files,
        payments,
        endAt: DateTime.fromJSDate(event.dateTime)
          .plus({
            minutes: dbEvent.totalDuration,
          })
          .toJSDate(),
      };

      const historyPayment: PaymentHistory | undefined = payments?.[0]
        ? {
            id: payments[0]._id,
            amount: payments[0].amount,
            status: payments[0].status,
            method: payments[0].method,
            type: payments[0].type,
            intentId:
              "intentId" in payments[0] ? payments[0].intentId : undefined,
            externalId:
              "externalId" in payments[0] ? payments[0].externalId : undefined,
            appName: "appName" in payments[0] ? payments[0].appName : undefined,
            appId: "appId" in payments[0] ? payments[0].appId : undefined,
          }
        : undefined;

      await this.addAppointmentHistory({
        appointmentId: id,
        type: "created",
        data: {
          ...historyActorFields(eventSource),
          confirmed: status === "confirmed",
          payment: historyPayment,
        },
      });

      if (dbEvent.discount) {
        await this.eventService.emit(
          DISCOUNT_APPLIED_EVENT_TYPE,
          {
            customer,
            discount: {
              id: dbEvent.discount.id,
              name: dbEvent.discount.name,
              value: dbEvent.discount.discountAmount,
              code: dbEvent.discount.code,
              dateTime: new Date(),
              appointmentId: id,
              appointmentOptionId: dbEvent.option?._id,
              appointmentAddonIds: dbEvent.addons?.map((addon) => addon._id),
              appointmentTotalPrice: dbEvent.totalPrice ?? 0,
              appointmentDateTime: dbEvent.dateTime,
            },
          } satisfies DiscountAppliedPayload,
          eventSource,
        );
      }

      logger.debug(
        { appointmentId: id, customerName: customer.name, status },
        "Event saved successfully",
      );

      return result;
    } catch (error) {
      logger.error({ error }, "Error saving event");
      throw error;
    }
    //   });
    // } finally {
    //   await session.endSession();
    // }
  }

  private async updateEventInDatabase(
    id: string,
    event: AppointmentEvent,
    oldEvent: Appointment,
    files?: Asset[],
    confirmed?: boolean,
  ): Promise<void> {
    const logger = this.loggerFactory("saveEvent");

    logger.debug(
      {
        appointmentId: id,
        customerName: event.fields.name,
        fileCount: files?.length || 0,
        confirmed,
      },
      "Updating event in database",
    );

    const db = await getDbConnection();
    const client = await getDbClient();
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        const appointments = db.collection<AppointmentEntity>(
          APPOINTMENTS_COLLECTION_NAME,
        );

        const status =
          confirmed || oldEvent.status === "confirmed"
            ? "confirmed"
            : "pending";

        const dbEvent: Partial<AppointmentEntity> = {
          ...event,
          dateTime: DateTime.fromJSDate(event.dateTime)
            .startOf("minute")
            .toJSDate(),
          status,
        };

        await appointments.updateOne(
          { _id: id, organizationId: this.organizationId },
          { $set: dbEvent },
        );

        await this.addAppointmentHistory({
          appointmentId: id,
          type: "updated",
          data: {
            oldOption: oldEvent.option,
            newOption: event.option,
            oldFields: oldEvent.fields,
            newFields: event.fields,
            oldAddons: oldEvent.addons,
            newAddons: event.addons,
            oldDiscount: oldEvent.discount,
            newDiscount: event.discount,
            oldNote: oldEvent.note,
            newNote: event.note,
            oldDateTime: oldEvent.dateTime,
            newDateTime: event.dateTime,
            oldDuration: oldEvent.totalDuration,
            newDuration: event.totalDuration,
            oldTotalPrice: oldEvent.totalPrice ?? 0,
            newTotalPrice: event.totalPrice ?? 0,
            oldTotalDuration: oldEvent.totalDuration,
            newTotalDuration: event.totalDuration,
            oldStatus: oldEvent.status,
            newStatus: status,
          },
        });

        logger.debug(
          { appointmentId: id, status },
          "Event updated in database successfully",
        );
      });
    } finally {
      await session.endSession();
    }
  }

  private get aggregateJoin() {
    return [
      {
        $addFields: {
          endAt: {
            $dateAdd: {
              startDate: "$dateTime",
              unit: "minute",
              amount: "$totalDuration",
            },
          },
        },
      },
      {
        $lookup: {
          from: CUSTOMERS_COLLECTION_NAME,
          localField: "customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      {
        $lookup: {
          from: MEMBERS_COLLECTION_NAME,
          localField: "memberId",
          foreignField: "_id",
          as: "member",
        },
      },
      {
        $lookup: {
          from: ASSETS_COLLECTION_NAME,
          localField: "_id",
          foreignField: "appointmentId",
          as: "files",
        },
      },
      {
        $lookup: {
          from: PAYMENTS_COLLECTION_NAME,
          localField: "_id",
          foreignField: "appointmentId",
          as: "payments",
        },
      },
      {
        $lookup: {
          from: CUSTOMER_PACKAGES_COLLECTION_NAME,
          localField: "packageUsage.customerPackageId",
          foreignField: "_id",
          as: "customerPackage",
        },
      },
      {
        $set: {
          customer: {
            $first: "$customer",
          },
          member: {
            $first: "$member",
          },
          customerPackage: {
            $first: "$customerPackage",
          },
        },
      },
    ];
  }
}
