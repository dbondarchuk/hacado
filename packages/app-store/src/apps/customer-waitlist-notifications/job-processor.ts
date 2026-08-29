import { renderToStaticMarkup } from "@hacado/email-builder/static";
import { AllKeys } from "@hacado/i18n";
import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  AppJobRequest,
  ConnectedAppData,
  IConnectedAppProps,
  isClosedAppointmentStatus,
  type Appointment,
  type AppointmentRescheduledPayload,
  type AppointmentSlotRescheduledPayload,
  type AppointmentStatusChangedPayload,
  type MemberProfileUpdatedPayload,
  type ScheduleChangedPayload,
} from "@hacado/types";
import {
  canUseMemberCalendarSources,
  getAdminUrl,
  getArguments,
  getWebsiteUrl,
  templateSafeWithError,
} from "@hacado/utils";
import pLimit from "p-limit";
import { WAITLIST_APP_NAME } from "../waitlist/const";
import { WaitlistEntry } from "../waitlist/models/waitlist";
import { WaitlistRepositoryService } from "../waitlist/service/repository-service";
import { createWaitlistOfferToken } from "../waitlist/waitlist-offer-token";
import {
  CustomerWaitlistNotificationsConfiguration,
  CustomerWaitlistNotificationsJobPayload,
  OFFER_OPENED_SLOT_JOB_TYPE,
  SCAN_SCHEDULE_OPENED_SLOTS_JOB_TYPE,
} from "./models";
import {
  appointmentOptionDurationMinutes,
  availabilityFetchRange,
  includesSlotStart,
  matchingStartsInFreedWindow,
  waitlistDurationMinutes,
  waitlistEntryMatchesSlot,
  windowFitsDuration,
} from "./slot-match";
import {
  CustomerWaitlistNotificationsAdminKeys,
  CustomerWaitlistNotificationsAdminNamespace,
} from "./translations/types";
import { getWaitlistEntryArgs, loadSlotTimeOfDayArgs } from "./waitlist-args";

const SCAN_MEMBER_CONCURRENCY = 3;

export class CustomerWaitlistNotificationsJobProcessor {
  protected readonly loggerFactory: LoggerFactory;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "CustomerWaitlistNotificationsJobProcessor",
      props.organizationId,
    );
  }

  public async processJob(
    appData: ConnectedAppData,
    jobData: AppJobRequest<CustomerWaitlistNotificationsJobPayload>,
  ): Promise<void> {
    const payload = jobData.payload;
    if (payload.type === OFFER_OPENED_SLOT_JOB_TYPE) {
      await this.processOfferOpenedSlot(appData, payload);
      return;
    }

    if (payload.type === SCAN_SCHEDULE_OPENED_SLOTS_JOB_TYPE) {
      await this.processScanScheduleOpenedSlots(appData, payload.memberIds);
    }
  }

  public async scheduleOfferOpenedSlot(
    appData: ConnectedAppData,
    args: {
      memberId: string;
      windowStart: Date;
      windowEnd: Date;
      afterCreatedAt?: Date;
      executeAt?: Date | "now";
    },
  ): Promise<void> {
    const logger = this.loggerFactory("scheduleOfferOpenedSlot");
    logger.debug(
      { appId: appData._id, args },
      "Scheduling offer-opened-slot job",
    );

    const config = appData.data as CustomerWaitlistNotificationsConfiguration;
    if (!config?.notifyOnSlotOpened) {
      logger.debug(
        { appId: appData._id, args },
        "Notify on slot opened is disabled, skipping",
      );

      return;
    }

    const windowStartIso = args.windowStart.toISOString();
    await this.props.services.jobService.scheduleJob({
      type: "app",
      appId: appData._id,
      executeAt: args.executeAt ?? "now",
      deduplication: {
        id: `offer-opened-slot:${args.memberId}:${args.windowStart.getTime()}:${args.afterCreatedAt?.getTime() ?? "first"}`,
        ttl: 60 * 60 * 1000,
      },
      payload: {
        type: OFFER_OPENED_SLOT_JOB_TYPE,
        memberId: args.memberId,
        windowStart: windowStartIso,
        windowEnd: args.windowEnd.toISOString(),
        afterCreatedAt: args.afterCreatedAt?.toISOString(),
      },
    });

    logger.debug(
      {
        appId: appData._id,
        memberId: args.memberId,
        windowStart: windowStartIso,
      },
      "Scheduled offer-opened-slot job",
    );
  }

  public async scheduleScanOpenedSlots(
    appData: ConnectedAppData,
    memberIds?: string[],
  ): Promise<void> {
    const logger = this.loggerFactory("scheduleScanOpenedSlots");
    logger.debug(
      { appId: appData._id, memberIds },
      "Scheduling scan opened slots",
    );

    const config = appData.data as CustomerWaitlistNotificationsConfiguration;
    if (!config?.notifyOnSlotOpened) {
      logger.debug(
        { appId: appData._id, memberIds },
        "Notify on slot opened is disabled, skipping",
      );

      return;
    }

    await this.props.services.jobService.scheduleJob({
      type: "app",
      appId: appData._id,
      executeAt: "now",
      deduplication: {
        id: `scan-schedule-opened-slots:${memberIds?.join(",") || "all"}`,
        ttl: 5 * 60 * 1000,
      },
      payload: {
        type: SCAN_SCHEDULE_OPENED_SLOTS_JOB_TYPE,
        memberIds,
      },
    });

    logger.debug(
      { appId: appData._id, memberIds },
      "Scheduled scan opened slots",
    );
  }

  public onAppointmentStatusChanged(
    appData: ConnectedAppData,
    payload: AppointmentStatusChangedPayload,
  ): Promise<void> {
    if (!isClosedAppointmentStatus(payload.newStatus)) {
      return Promise.resolve();
    }
    if (payload.oldStatus && isClosedAppointmentStatus(payload.oldStatus)) {
      return Promise.resolve();
    }
    return this.scheduleOfferFromAppointmentWindow(
      appData,
      payload.appointment,
      payload.appointment.dateTime,
      payload.appointment.totalDuration,
    );
  }

  public onAppointmentSlotRescheduled(
    appData: ConnectedAppData,
    payload: AppointmentSlotRescheduledPayload,
  ): Promise<void> {
    if (!payload.oldTime || payload.oldDuration == null) {
      return Promise.resolve();
    }
    return this.scheduleOfferFromAppointmentWindow(
      appData,
      payload.appointment,
      payload.oldTime,
      payload.oldDuration,
    );
  }

  public onAppointmentRescheduled(
    appData: ConnectedAppData,
    payload: AppointmentRescheduledPayload,
  ): Promise<void> {
    return this.scheduleOfferFromAppointmentWindow(
      appData,
      payload.updatedAppointment,
      payload.previousDateTime,
      payload.previousTotalDuration,
    );
  }

  public async onScheduleChanged(
    appData: ConnectedAppData,
    payload: ScheduleChangedPayload,
  ): Promise<void> {
    await this.scheduleScanOpenedSlots(appData, payload.memberIds);
  }

  public async onMemberProfileUpdated(
    appData: ConnectedAppData,
    payload: MemberProfileUpdatedPayload,
  ): Promise<void> {
    if (payload.update.calendarSources === undefined) {
      return;
    }
    const booking =
      await this.props.services.configurationService.getConfiguration(
        "booking",
      );
    if (
      !canUseMemberCalendarSources(payload.member.role, {
        allowStaffCalendarSources: booking.allowStaffCalendarSources,
      })
    ) {
      return;
    }
    await this.scheduleScanOpenedSlots(appData, [payload.member._id]);
  }

  private async scheduleOfferFromAppointmentWindow(
    appData: ConnectedAppData,
    appointment: Appointment,
    windowStart: Date,
    durationMinutes: number,
  ): Promise<void> {
    const windowEnd = new Date(
      windowStart.getTime() + durationMinutes * 60_000,
    );
    await this.scheduleOfferOpenedSlot(appData, {
      memberId: appointment.memberId,
      windowStart,
      windowEnd,
    });
  }

  private async processOfferOpenedSlot(
    appData: ConnectedAppData,
    payload: Extract<
      CustomerWaitlistNotificationsJobPayload,
      { type: typeof OFFER_OPENED_SLOT_JOB_TYPE }
    >,
  ): Promise<void> {
    const logger = this.loggerFactory("processOfferOpenedSlot");
    logger.debug(
      { appId: appData._id, payload },
      "Processing offer-opened-slot job",
    );

    const config = appData.data as CustomerWaitlistNotificationsConfiguration;
    if (!config?.notifyOnSlotOpened) {
      logger.debug(
        { appId: appData._id, payload },
        "Notify on slot opened is disabled",
      );

      return;
    }

    const repo = await this.getWaitlistRepository();
    if (!repo) {
      logger.debug({ appId: appData._id }, "Waitlist app not installed");
      return;
    }

    const windowStart = new Date(payload.windowStart);
    const windowEnd = new Date(payload.windowEnd);
    const timeZone = (
      await this.props.services.configurationService.getConfiguration("general")
    ).timeZone;
    const cooldownMs = (config.cooldownMinutes ?? 180) * 60_000;
    const exclusiveMinutes = config.exclusiveAccessMinutes ?? 0;
    const availabilityByDuration = new Map<number, Date[]>();

    let afterCreatedAt = payload.afterCreatedAt
      ? new Date(payload.afterCreatedAt)
      : undefined;

    while (true) {
      logger.debug(
        { appId: appData._id, payload, afterCreatedAt },
        "Finding next active matching entry",
      );

      const entry = await repo.findNextActiveMatchingEntry({
        memberId: payload.memberId,
        afterCreatedAt,
      });

      if (!entry) {
        logger.debug(
          { appId: appData._id, payload, afterCreatedAt },
          "No next active matching entry found",
        );

        return;
      }

      afterCreatedAt = entry.createdAt;

      if (
        entry.lastSlotOpenedNotifiedAt &&
        Date.now() - new Date(entry.lastSlotOpenedNotifiedAt).getTime() <
          cooldownMs
      ) {
        logger.debug(
          { appId: appData._id, payload, afterCreatedAt },
          "Entry is within cooldown period, skipping",
        );

        continue;
      }

      const duration = waitlistDurationMinutes(entry, entry.option?.duration);
      if (
        duration == null ||
        !windowFitsDuration(windowStart, windowEnd, duration)
      ) {
        logger.debug(
          { appId: appData._id, payload, windowStart, windowEnd, duration },
          "Duration does not fit window, skipping",
        );
        continue;
      }

      if (!availabilityByDuration.has(duration)) {
        const { from, to } = availabilityFetchRange(
          windowStart,
          windowEnd,
          timeZone,
        );
        availabilityByDuration.set(
          duration,
          await this.props.services.bookingService.getAvailability(
            duration,
            payload.memberId,
            { from, to },
          ),
        );
      }

      const candidates = matchingStartsInFreedWindow(
        availabilityByDuration.get(duration) ?? [],
        windowStart,
        windowEnd,
        duration,
        entry,
        timeZone,
      );

      let offeredStart: Date | undefined;
      let hasOtherTimes = false;

      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        if (includesSlotStart(entry.slotOpenedNotifiedStarts, candidate)) {
          continue;
        }

        if (
          await repo.customerHasNotifiedSlotStart({
            customerId: entry.customerId,
            memberId: payload.memberId,
            slotStart: candidate,
          })
        ) {
          continue;
        }

        const stillFree =
          await this.props.services.bookingService.verifyTimeAvailability(
            candidate,
            duration,
            payload.memberId,
          );
        if (!stillFree) {
          logger.debug(
            { appId: appData._id, candidate },
            "Candidate start is no longer bookable, trying later start",
          );
          continue;
        }

        offeredStart = candidate;
        hasOtherTimes = candidates.slice(i + 1).length > 0;
        break;
      }

      if (!offeredStart) {
        logger.debug(
          { appId: appData._id, payload, entryId: entry._id },
          "No remaining bookable start in window for entry, skipping",
        );
        continue;
      }

      await this.sendSlotOpenedNotification(
        appData,
        config,
        entry,
        offeredStart,
        hasOtherTimes,
      );

      logger.debug(
        { appId: appData._id, payload, entryId: entry._id },
        "Sent slot-opened notification",
      );

      await repo.setLastSlotOpenedNotifiedAt(
        entry._id,
        new Date(),
        offeredStart,
      );

      if (exclusiveMinutes > 0) {
        logger.debug(
          { appId: appData._id, payload, entryId: entry._id },
          "Scheduling next offer-opened-slot job",
        );

        await this.scheduleOfferOpenedSlot(appData, {
          memberId: payload.memberId,
          windowStart,
          windowEnd,
          afterCreatedAt: entry.createdAt,
          executeAt: new Date(Date.now() + exclusiveMinutes * 60_000),
        });

        logger.debug(
          { appId: appData._id, payload, entryId: entry._id },
          "Scheduled next offer-opened-slot job",
        );

        return;
      }
    }
  }

  private async processScanScheduleOpenedSlots(
    appData: ConnectedAppData,
    memberIds?: string[],
  ): Promise<void> {
    const logger = this.loggerFactory("processScanScheduleOpenedSlots");
    const config = appData.data as CustomerWaitlistNotificationsConfiguration;
    logger.debug(
      { appId: appData._id, config },
      "Processing scan schedule opened slots",
    );

    if (!config?.notifyOnSlotOpened) {
      logger.debug(
        { appId: appData._id, config },
        "Notify on slot opened is disabled, skipping",
      );

      return;
    }

    const repo = await this.getWaitlistRepository();
    if (!repo) {
      logger.debug(
        { appId: appData._id },
        "Waitlist app not installed, skipping",
      );

      return;
    }

    const timeZone = (
      await this.props.services.configurationService.getConfiguration("general")
    ).timeZone;

    const scopedMemberIds = [
      ...new Set(
        memberIds && memberIds.length > 0
          ? memberIds
          : await repo.getDistinctActiveWaitlistMemberIds(),
      ),
    ];

    logger.debug(
      { appId: appData._id, scopedMemberIds },
      "Found scoped member IDs",
    );

    const entries = await repo.getActiveWaitlistEntities(scopedMemberIds);
    logger.debug({ appId: appData._id, entries }, "Found entries");

    const { options } =
      await this.props.services.bookingService.getAppointmentOptions();
    logger.debug({ appId: appData._id, options }, "Found options");

    const optionDurationById = new Map(
      options.map(
        (option) =>
          [option._id, appointmentOptionDurationMinutes(option)] as const,
      ),
    );

    const limit = pLimit(SCAN_MEMBER_CONCURRENCY);
    await Promise.all(
      scopedMemberIds.map((memberId) =>
        limit(async () => {
          const offeredSlots = new Set<number>();
          const memberEntries = entries.filter((e) => e.memberId === memberId);
          const durations = [
            ...new Set(
              memberEntries
                .map((e) =>
                  waitlistDurationMinutes(
                    e,
                    optionDurationById.get(e.optionId),
                  ),
                )
                .filter((d): d is number => typeof d === "number" && d > 0),
            ),
          ];

          logger.debug(
            { appId: appData._id, memberId, durations },
            "Found durations",
          );

          const availabilityByDuration = new Map<number, Date[]>();
          for (const duration of durations) {
            availabilityByDuration.set(
              duration,
              await this.props.services.bookingService.getAvailability(
                duration,
                memberId,
              ),
            );
          }

          logger.debug(
            { appId: appData._id, memberId, availabilityByDuration },
            "Found availability by duration",
          );

          for (const entry of memberEntries) {
            const duration = waitlistDurationMinutes(
              entry,
              optionDurationById.get(entry.optionId),
            );

            if (duration == null) continue;
            const slots = availabilityByDuration.get(duration) ?? [];
            for (const slot of slots) {
              logger.debug(
                { appId: appData._id, memberId, entryId: entry._id, slot },
                "Checking if entry matches slot",
              );

              if (!waitlistEntryMatchesSlot(entry, slot, timeZone)) {
                logger.debug(
                  { appId: appData._id, memberId, entryId: entry._id, slot },
                  "Entry does not match slot, skipping",
                );

                continue;
              }

              const slotTime = slot.getTime();
              if (offeredSlots.has(slotTime)) {
                logger.debug(
                  { appId: appData._id, memberId, entryId: entry._id, slot },
                  "Slot already offered, skipping",
                );

                continue;
              }

              offeredSlots.add(slotTime);
              await this.scheduleOfferOpenedSlot(appData, {
                memberId,
                windowStart: slot,
                windowEnd: new Date(slot.getTime() + duration * 60_000),
              });

              logger.debug(
                { appId: appData._id, memberId, entryId: entry._id, slot },
                "Scheduled offer opened slot",
              );
            }
          }
        }),
      ),
    );

    logger.debug(
      { appId: appData._id, memberCount: scopedMemberIds.length },
      "Finished schedule opened-slot scan",
    );
  }

  public async sendSlotOpenedNotification(
    appData: ConnectedAppData,
    config: CustomerWaitlistNotificationsConfiguration,
    entry: WaitlistEntry,
    slotStart: Date,
    hasOtherTimes = false,
  ): Promise<void> {
    const logger = this.loggerFactory("sendSlotOpenedNotification");
    const args = await this.buildSlotNotificationArgs(
      appData,
      config,
      entry,
      slotStart,
      hasOtherTimes,
    );

    logger.debug(
      { appId: appData._id, entryId: entry._id, args },
      "Built slot notification args",
    );

    if (!args) {
      logger.debug(
        { appId: appData._id, entryId: entry._id },
        "No args, skipping",
      );

      return;
    }

    if (config.slotOpenedEmailTemplateId && entry.email) {
      const template = await this.props.services.templatesService.getTemplate(
        config.slotOpenedEmailTemplateId,
      );

      logger.debug(
        {
          appId: appData._id,
          entryId: entry._id,
          templateId: config.slotOpenedEmailTemplateId,
        },
        "Found email template",
      );

      if (template?.type === "email") {
        const subject = templateSafeWithError(template.subject, args);
        const body = await renderToStaticMarkup({
          args,
          document: template.value,
        });

        logger.debug(
          { appId: appData._id, entryId: entry._id, subject, body },
          "Rendered email template",
        );

        await this.props.services.notificationService.sendEmail({
          email: { to: entry.email, subject, body },
          participantType: "customer",
          memberId: entry.memberId,
          handledBy:
            "app_customer-waitlist-notifications_admin.handlers.slotOpened" satisfies AllKeys<
              CustomerWaitlistNotificationsAdminNamespace,
              CustomerWaitlistNotificationsAdminKeys
            >,
          customerId: entry.customer._id,
        });

        logger.debug(
          { appId: appData._id, entryId: entry._id },
          "Sent email notification",
        );
      }
    }

    if (config.slotOpenedSmsTemplateId && entry.phone) {
      const template = await this.props.services.templatesService.getTemplate(
        config.slotOpenedSmsTemplateId,
      );

      if (template?.type === "text-message") {
        logger.debug(
          {
            appId: appData._id,
            entryId: entry._id,
            templateId: config.slotOpenedSmsTemplateId,
          },
          "Found SMS template, sending SMS notification",
        );

        await this.props.services.notificationService.sendTextMessage({
          phone: entry.phone,
          body: templateSafeWithError(template.value, args),
          participantType: "customer",
          memberId: entry.memberId,
          handledBy:
            "app_customer-waitlist-notifications_admin.handlers.slotOpened" satisfies AllKeys<
              CustomerWaitlistNotificationsAdminNamespace,
              CustomerWaitlistNotificationsAdminKeys
            >,
          customerId: entry.customer._id,
          webhookData: {
            appId: appData._id,
            customerId: entry.customer._id,
            data: entry._id,
          },
        });

        logger.debug(
          { appId: appData._id, entryId: entry._id },
          "Sent SMS notification",
        );
      }
    }

    logger.info(
      { appId: appData._id, entryId: entry._id },
      "Sent slot-opened waitlist notification",
    );
  }

  public async sendLeaveConfirmSms(
    appData: ConnectedAppData,
    config: CustomerWaitlistNotificationsConfiguration,
    entry: WaitlistEntry,
  ): Promise<void> {
    const logger = this.loggerFactory("sendLeaveConfirmSms");
    logger.debug(
      { appId: appData._id, entryId: entry._id },
      "Sending leave confirm SMS notification",
    );

    if (!config.leaveWaitlistSmsTemplateId || !entry.phone) {
      logger.debug(
        { appId: appData._id, entryId: entry._id },
        "No leave confirm SMS template or phone, skipping",
      );

      return;
    }

    const template = await this.props.services.templatesService.getTemplate(
      config.leaveWaitlistSmsTemplateId,
    );

    if (template?.type !== "text-message") {
      logger.debug(
        { appId: appData._id, entryId: entry._id },
        "No leave confirm SMS template or phone, skipping",
      );

      return;
    }

    const args = await this.buildSlotNotificationArgs(
      appData,
      config,
      entry,
      new Date(),
    );

    if (!args) {
      logger.debug(
        { appId: appData._id, entryId: entry._id },
        "No args, skipping",
      );

      return;
    }

    logger.debug(
      { appId: appData._id, entryId: entry._id },
      "Sending leave confirm SMS notification",
    );

    await this.props.services.notificationService.sendTextMessage({
      phone: entry.phone,
      body: templateSafeWithError(template.value, args),
      participantType: "customer",
      memberId: entry.memberId,
      handledBy:
        "app_customer-waitlist-notifications_admin.handlers.leaveWaitlist" satisfies AllKeys<
          CustomerWaitlistNotificationsAdminNamespace,
          CustomerWaitlistNotificationsAdminKeys
        >,
      customerId: entry.customer._id,
    });

    logger.debug(
      { appId: appData._id, entryId: entry._id },
      "Sent leave confirm SMS notification",
    );
  }

  public async buildSlotNotificationArgs(
    appData: ConnectedAppData,
    config: CustomerWaitlistNotificationsConfiguration,
    entry: WaitlistEntry,
    slotStart: Date,
    hasOtherTimes = false,
  ) {
    const logger = this.loggerFactory("buildSlotNotificationArgs");
    logger.debug(
      { appId: appData._id, entryId: entry._id, slotStart },
      "Building slot notification args",
    );

    const organization =
      await this.props.services.organizationService.getOrganization();

    if (!organization) {
      logger.debug(
        { appId: appData._id, entryId: entry._id },
        "No organization, skipping",
      );

      return null;
    }

    const brandConfig =
      await this.props.services.configurationService.getConfigurations(
        "booking",
        "general",
        "brand",
        "social",
      );

    const websiteUrl = getWebsiteUrl(organization);
    const { bookingUrl, leaveWaitlistUrl } = await this.buildCustomerUrls(
      appData,
      config,
      websiteUrl,
      entry._id,
      slotStart,
    );

    logger.debug(
      { appId: appData._id, entryId: entry._id, bookingUrl, leaveWaitlistUrl },
      "Built customer URLs",
    );

    return getArguments({
      appointment: null,
      config: brandConfig,
      customer: entry.customer,
      useAppointmentTimezone: true,
      locale: brandConfig.brand.language,
      additionalProperties: {
        waitlistEntry: getWaitlistEntryArgs(entry),
        bookingUrl,
        leaveWaitlistUrl,
        slotDateTime: slotStart,
        dateTime: slotStart,
        smsRemoveKeyword: config.smsRemoveKeyword || "REMOVE",
        hasOtherTimes,
        ...(await loadSlotTimeOfDayArgs(
          slotStart,
          brandConfig.general.timeZone,
          brandConfig.brand.language,
        )),
      },
      adminUrl: getAdminUrl(),
      websiteUrl,
    });
  }

  public async buildCustomerUrls(
    appData: ConnectedAppData,
    config: CustomerWaitlistNotificationsConfiguration,
    websiteUrl: string,
    entryId: string,
    slotStart: Date,
  ): Promise<{ bookingUrl: string; leaveWaitlistUrl: string; slug: string }> {
    const token = createWaitlistOfferToken(entryId, slotStart);
    let slug = "";
    if (config.bookingPageId) {
      const page = await this.props.services.pagesService.getPage(
        config.bookingPageId,
      );
      slug = page?.slug ?? "";
    }

    const bookPath = slug ? `/${slug}` : "/";
    return {
      slug,
      bookingUrl: `${websiteUrl}${bookPath}?w=${encodeURIComponent(token)}`,
      leaveWaitlistUrl: `${websiteUrl}/api/apps/${appData._id}/leave-waitlist?w=${encodeURIComponent(token)}`,
    };
  }

  public async getWaitlistRepository(): Promise<WaitlistRepositoryService | null> {
    const [waitlistApp] =
      await this.props.services.connectedAppsService.getAppsByApp(
        WAITLIST_APP_NAME,
      );

    if (!waitlistApp) {
      return null;
    }

    return new WaitlistRepositoryService(
      waitlistApp._id,
      this.props.organizationId,
      this.props.getDbConnection,
      this.props.services,
    );
  }
}
