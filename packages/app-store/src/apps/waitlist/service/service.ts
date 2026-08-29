import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  ApiRequest,
  ApiResponse,
  Appointment,
  BOOKING_TRACKING_STEP_EVENT_TYPE,
  BookingTrackingEventData,
  ConnectedAppData,
  ConnectedAppRequestError,
  ConnectedAppStatusWithText,
  ConnectedAppUninstallResult,
  CUSTOMER_SESSION_COOKIE,
  DashboardNotification,
  DemoArguments,
  effectiveAddonDuration,
  EventEnvelope,
  ICommunicationTemplatesProvider,
  IConnectedApp,
  IConnectedAppProps,
  IDashboardNotifierApp,
  IDemoArgumentsProvider,
  IEventSubscriber,
  isAddonAvailableForMember,
  readCookieValue,
  SessionUser,
  TemplateTemplatesList,
  type EventSource,
} from "@hacado/types";
import {
  dispatchAppointmentEventPayload,
  gateMemberIds,
  hasPermission,
} from "@hacado/utils";
import {
  CreateWaitlistEntryAction,
  CreateWaitlistEntryActionType,
  DismissWaitlistEntriesAction,
  DismissWaitlistEntriesActionType,
  GetWaitlistEntriesAction,
  GetWaitlistEntriesActionType,
  GetWaitlistEntryAction,
  GetWaitlistEntryActionType,
  RequestAction,
  requestActionSchema,
  SetConfigurationAction,
  SetConfigurationActionType,
  WaitlistConfiguration,
  waitlistConfigurationSchema,
  WaitlistEntry,
  WaitlistOfferPrefill,
  WaitlistRequest,
  waitlistRequestSchema,
} from "../models";

import { demoWaitlistEntry } from "../demo-arguments";
import { WaitlistTemplates } from "../templates";
import {
  WaitlistAdminAllKeys,
  WaitlistAdminKeys,
  WaitlistAdminNamespace,
} from "../translations/types";
import { verifyWaitlistOfferToken } from "../waitlist-offer-token";
import {
  WAITLIST_COLLECTION_NAME,
  WaitlistRepositoryService,
} from "./repository-service";

export class WaitlistConnectedApp
  implements
    IConnectedApp,
    IEventSubscriber,
    IDashboardNotifierApp,
    IDemoArgumentsProvider,
    ICommunicationTemplatesProvider
{
  protected readonly loggerFactory: LoggerFactory;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "WaitlistConnectedApp",
      props.organizationId,
    );
  }

  public async onEvent(
    appData: ConnectedAppData,
    envelope: EventEnvelope,
  ): Promise<void> {
    await dispatchAppointmentEventPayload(envelope, {
      onAppointmentCreated: (appointment, confirmed) =>
        this.onAppointmentCreated(appData, appointment, confirmed),
    });
  }

  public async processRequest(
    appData: ConnectedAppData,
    request: RequestAction,
    httpRequest?: ApiRequest,
    user?: SessionUser,
  ): Promise<any> {
    void httpRequest;
    const logger = this.loggerFactory("processRequest");
    logger.debug(
      { appId: appData._id },
      "Processing waitlist notification request",
    );

    if (!user?.memberId) {
      throw new ConnectedAppRequestError(
        "invalid_waitlist_request",
        { request },
        400,
        "Missing user context",
      );
    }

    const memberId = user.memberId;
    const { data, success, error } = requestActionSchema.safeParse(request);
    if (!success) {
      logger.error({ error }, "Invalid waitlist request");
      throw new ConnectedAppRequestError(
        "invalid_waitlist_request",
        { request },
        400,
        error.message,
      );
    }

    switch (data.type) {
      case GetWaitlistEntryActionType:
        return this.processGetWaitlistEntryRequest(appData, data);
      case GetWaitlistEntriesActionType:
        return this.processGetWaitlistEntriesRequest(appData, data, user);
      case DismissWaitlistEntriesActionType:
        return this.processDismissWaitlistEntriesRequest(
          appData,
          data,
          memberId,
        );
      case SetConfigurationActionType:
        return this.processSetConfigurationRequest(
          appData,
          data.configuration,
          user,
        );
      case CreateWaitlistEntryActionType:
        return this.processCreateWaitlistEntryActionRequest(
          appData,
          data,
          memberId,
        );
    }
  }

  public async install(appData: ConnectedAppData): Promise<void> {
    const logger = this.loggerFactory("install");
    logger.debug({ appId: appData._id }, "Installing waitlist app");

    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );

    await repositoryService.installWaitlistApp();

    await this.props.update({
      data: {
        notifyMemberOnNewEntry: true,
        notifyCoordinatorsOnNewEntry: false,
      } satisfies WaitlistConfiguration,
    });

    logger.debug({ appId: appData._id }, "Waitlist app installed successfully");
  }

  public async unInstall(
    appData: ConnectedAppData,
  ): Promise<ConnectedAppUninstallResult> {
    const logger = this.loggerFactory("unInstall");
    logger.debug({ appId: appData._id }, "Uninstalling follow-ups app");

    try {
      const db = await this.props.getDbConnection();
      const collection = db.collection<WaitlistEntry>(WAITLIST_COLLECTION_NAME);
      await collection.deleteMany({
        appId: appData._id,
        organizationId: this.props.organizationId,
      });

      const count = await collection.countDocuments({});
      if (count === 0) {
        await db.dropCollection(WAITLIST_COLLECTION_NAME);
      }

      logger.info(
        { appId: appData._id },
        "Successfully uninstalled waitlist app",
      );
      return { success: true, code: "ok" };
    } catch (error: any) {
      logger.error(
        { appId: appData._id, error: error?.message || error?.toString() },
        "Error uninstalling waitlist app",
      );
      throw error;
    }
  }

  public async processAppCall(
    appData: ConnectedAppData,
    slug: string[],
    request: ApiRequest,
  ): Promise<ApiResponse> {
    if (
      slug.length === 1 &&
      slug[0] === "waitlist" &&
      request.method.toUpperCase() === "POST"
    ) {
      return this.processCreateWaitlistEntryRequest(appData, request);
    }

    const action = slug.join("/");
    if (
      request.method.toUpperCase() === "GET" &&
      action === "customer-waitlist-entries"
    ) {
      return this.getCustomerWaitlistEntries(appData, request);
    }

    if (
      request.method.toUpperCase() === "POST" &&
      action === "dismiss-customer-waitlist-entry"
    ) {
      return this.dismissCustomerWaitlistEntry(appData, request);
    }

    if (request.method.toUpperCase() === "GET" && action === "waitlist-offer") {
      return this.getWaitlistOfferPrefill(appData, request);
    }

    return Response.json(
      { success: false, error: "Unknown request" },
      { status: 404 },
    );
  }

  public async onAppointmentCreated(
    appData: ConnectedAppData,
    appointment: Appointment,
    confirmed: boolean,
  ): Promise<void> {
    const logger = this.loggerFactory("onAppointmentCreated");
    const waitlistId = this.resolveWaitlistIdFromAppointmentData(
      appointment.data,
    );

    if (!waitlistId) {
      logger.debug(
        { appId: appData._id },
        "Waitlist ID not found in appointment data, skipping appointment created hook",
      );

      return;
    }

    logger.debug(
      {
        appId: appData._id,
        appointmentId: appointment._id,
        waitlistId,
      },
      "Appointment created from waitlist, dismissing waitlist entry",
    );

    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );
    const result = await repositoryService.getWaitlistEntry(waitlistId);
    if (!result) {
      logger.debug(
        { appId: appData._id, waitlistId },
        "Waitlist entry not found, skipping appointment created hook",
      );
      return;
    }

    logger.debug(
      { appId: appData._id, waitlistId },
      "Waitlist entry found, dismissing waitlist entry",
    );

    await repositoryService.dismissWaitlistEntry(result._id, {
      actor: "system",
    });

    logger.debug(
      { appId: appData._id, waitlistId },
      "Waitlist entry dismissed",
    );
  }

  public async getInitialNotifications(
    appData: ConnectedAppData,
    _memberId: string,
    date?: Date,
  ): Promise<DashboardNotification[]> {
    const logger = this.loggerFactory("getNotifications");
    logger.debug({ date }, "Getting waitlist notifications");

    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );
    const result = await repositoryService.getWaitlistEntriesCount(date);

    logger.debug({ result }, "Waitlist entries count retrieved");

    return [
      {
        type: "waitlist-entries",
        badges: [
          {
            key: "waitlist_entries",
            count: result.totalCount,
          },
        ],
        toast:
          result.newCount > 0
            ? {
                type: "info",
                title: {
                  key: "app_waitlist_admin.notifications.newEntries" satisfies WaitlistAdminAllKeys,
                },
                message: {
                  key: "app_waitlist_admin.notifications.message" satisfies WaitlistAdminAllKeys,
                  args: {
                    count: result.newCount,
                  },
                },
                action: {
                  label: {
                    key: "app_waitlist_admin.notifications.viewWaitlist" satisfies WaitlistAdminAllKeys,
                  },
                  href: `/dashboard?activeTab=waitlist&key=${Date.now()}`,
                },
              }
            : undefined,
      },
    ];
  }

  public async getDemoEmailArguments(): Promise<DemoArguments> {
    return {
      waitlistEntry: demoWaitlistEntry,
    };
  }

  public async getCommunicationTemplates(): Promise<TemplateTemplatesList> {
    return WaitlistTemplates;
  }

  protected getRepositoryService(appId: string, organizationId: string) {
    return new WaitlistRepositoryService(
      appId,
      organizationId,
      this.props.getDbConnection,
      this.props.services,
    );
  }

  private resolveWaitlistIdFromAppointmentData(
    data?: Record<string, any>,
  ): string | undefined {
    if (typeof data?.waitlistId === "string" && data.waitlistId) {
      return data.waitlistId;
    }

    if (typeof data?.waitlistToken === "string" && data.waitlistToken) {
      return verifyWaitlistOfferToken(data.waitlistToken)?.entryId;
    }

    return undefined;
  }

  private async getWaitlistOfferPrefill(
    appData: ConnectedAppData,
    request: Request,
  ): Promise<Response> {
    const token = new URL(request.url).searchParams.get("w");
    const decoded = token ? verifyWaitlistOfferToken(token) : null;
    if (!decoded) {
      return Response.json({ error: "invalid_token" }, { status: 400 });
    }

    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );

    const entry = await repositoryService.getWaitlistEntry(decoded.entryId);
    if (!entry || entry.status !== "active") {
      return Response.json({ error: "not_found" }, { status: 404 });
    }

    const duration = entry.duration ?? entry.option?.duration;
    if (!duration) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }

    const body: WaitlistOfferPrefill = {
      optionId: entry.optionId,
      addonsIds: entry.addonsIds,
      memberId: entry.memberId,
      dateTime: decoded.slot.toISOString(),
      duration,
      fields: {
        name: entry.name,
        email: entry.email,
        phone: entry.phone ?? "",
      },
    };

    return Response.json(body);
  }

  private async authorizeCustomerSession(
    appData: ConnectedAppData,
    request: Request,
  ): Promise<Response | { customerId: string }> {
    const sessionToken = readCookieValue(
      request.headers.get("cookie"),
      CUSTOMER_SESSION_COOKIE,
    );

    const session =
      await this.props.services.customerAuthService.authorizeSession(
        sessionToken,
      );

    if (!session || session.organizationId !== appData.organizationId) {
      return Response.json(
        { success: false, error: "unauthorized" },
        { status: 401 },
      );
    }

    return { customerId: session.customerId };
  }

  private toCustomerWaitlistItem(entry: {
    _id: string;
    option?: { name?: string };
    member?: { name?: string };
    asSoonAsPossible: boolean;
    dates?: { date: string; time: string[] }[];
    duration?: number;
    createdAt: Date;
  }) {
    return {
      _id: entry._id,
      optionName: entry.option?.name ?? "",
      memberName: entry.member?.name ?? "",
      asSoonAsPossible: entry.asSoonAsPossible,
      dates: entry.dates,
      duration: entry.duration,
      createdAt: entry.createdAt,
    };
  }

  private async getCustomerWaitlistEntries(
    appData: ConnectedAppData,
    request: Request,
  ): Promise<Response> {
    const auth = await this.authorizeCustomerSession(appData, request);
    if (auth instanceof Response) {
      return auth;
    }

    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );

    const result = await repositoryService.getWaitlistEntries({
      customerId: auth.customerId,
      status: ["active"],
    });

    return Response.json({
      items: result.items.map((entry) => this.toCustomerWaitlistItem(entry)),
    });
  }

  private async dismissCustomerWaitlistEntry(
    appData: ConnectedAppData,
    request: Request,
  ): Promise<Response> {
    const auth = await this.authorizeCustomerSession(appData, request);
    if (auth instanceof Response) {
      return auth;
    }

    const body = (await request.json().catch(() => ({}))) as {
      id?: string;
      all?: boolean;
    };

    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );

    if (body.all) {
      const result = await repositoryService.getWaitlistEntries({
        customerId: auth.customerId,
        status: ["active"],
      });

      const ids = result.items.map((entry) => entry._id);
      if (ids.length > 0) {
        await repositoryService.dismissWaitlistEntries(ids, {
          actor: "customer",
          actorId: auth.customerId,
        });
      }

      return Response.json({ success: true });
    }

    if (!body.id) {
      return Response.json(
        { success: false, error: "id_required" },
        { status: 400 },
      );
    }

    const entry = await repositoryService.getWaitlistEntry(body.id);
    if (!entry || entry.customerId !== auth.customerId) {
      return Response.json(
        { success: false, error: "not_found" },
        { status: 404 },
      );
    }
    if (entry.status === "active") {
      await repositoryService.dismissWaitlistEntry(entry._id, {
        actor: "customer",
        actorId: auth.customerId,
      });
    }

    return Response.json({ success: true });
  }

  private async resolveDefaultMemberId(): Promise<string> {
    const owner = await this.props.services.teamService.getOwnerMember();
    return owner._id;
  }

  private async processCreateWaitlistEntryRequest(
    appData: ConnectedAppData,
    request: ApiRequest,
  ): Promise<ApiResponse> {
    const logger = this.loggerFactory("processCreateWaitlistEntryRequest");
    const requestParsed = await request.json();

    if (!requestParsed?.memberId) {
      requestParsed.memberId = await this.resolveDefaultMemberId();
    }

    const { data, success, error } =
      waitlistRequestSchema.safeParse(requestParsed);
    if (!success) {
      logger.error({ error }, "Invalid waitlist request");
      return Response.json({ success: false, error }, { status: 400 });
    }

    logger.debug({ data }, "Creating waitlist entry");

    const options =
      await this.props.services.bookingService.getAppointmentOptions();
    const option = options.options.find((o) => o._id === data.optionId);
    if (!option) {
      logger.error({ data }, "Option not found");
      return Response.json(
        { success: false, error: "Option not found", code: "option_not_found" },
        { status: 400 },
      );
    }

    if (
      data.addonsIds?.length &&
      !data.addonsIds.every((id) => option.addons?.some((a) => a._id === id))
    ) {
      logger.error({ data }, "Addons not found");
      return Response.json(
        { success: false, error: "Addons not found", code: "addons_not_found" },
        { status: 400 },
      );
    }

    try {
      const result = await this.createWaitlistEntry(appData, data);

      // Track booking conversion to waitlist if sessionId is available
      const sessionId = request.headers.get("x-session-id");
      if (sessionId) {
        try {
          const eventData: BookingTrackingEventData = {
            sessionId,
            step: "BOOKING_CONVERTED",
            metadata: {
              convertedTo: "waitlist",
              convertedId: result._id,
              convertedAppName: "waitlist",
              customerId: result.customer._id,
              customerEmail: result.customer.email,
              customerName: result.customer.name,
              optionId: data.optionId,
              duration: data.duration,
            },
          };

          await this.props.services.eventService.emit(
            BOOKING_TRACKING_STEP_EVENT_TYPE,
            eventData,
            {
              actor: "customer",
              actorId: result.customer._id,
            },
          );

          logger.debug(
            { sessionId, waitlistEntryId: result._id },
            "Booking conversion to waitlist tracked",
          );
        } catch (trackingError) {
          // Don't fail waitlist creation if tracking fails
          logger.warn(
            { error: trackingError, sessionId },
            "Failed to track booking conversion to waitlist",
          );
        }
      }

      logger.debug({ result }, "Waitlist entry created");
      return Response.json(result, { status: 201 });
    } catch (error: any) {
      logger.error({ error }, "Error creating waitlist entry");
      return Response.json({ success: false, error }, { status: 500 });
    }
  }

  private async processCreateWaitlistEntryActionRequest(
    appData: ConnectedAppData,
    data: CreateWaitlistEntryAction,
    memberId: string,
  ): Promise<WaitlistEntry> {
    const logger = this.loggerFactory(
      "processCreateWaitlistEntryActionRequest",
    );
    logger.debug({ data }, "Creating waitlist entry");

    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );

    const option = await this.props.services.servicesService.getOption(
      data.entry.optionId,
    );
    if (!option) {
      logger.error({ optionId: data.entry.optionId }, "Option not found");
      throw new ConnectedAppRequestError(
        "option_not_found",
        { data },
        400,
        "Option not found",
      );
    }

    const addons = data.entry.addonsIds?.length
      ? await this.props.services.servicesService.getAddonsById(
          data.entry.addonsIds,
        )
      : undefined;

    if (
      data.entry.addonsIds?.length &&
      !data.entry.addonsIds.every((id) => addons?.some((a) => a._id === id))
    ) {
      logger.error({ addonsIds: data.entry.addonsIds }, "Addons not found");
      throw new ConnectedAppRequestError(
        "addons_not_found",
        { data },
        400,
        "Addons not found",
      );
    }

    const memberIdForAddons =
      data.entry.memberId ?? (await this.resolveDefaultMemberId());

    if (
      memberIdForAddons &&
      addons?.some(
        (addon) => !isAddonAvailableForMember(addon.staff, memberIdForAddons),
      )
    ) {
      logger.error(
        { memberId: memberIdForAddons, addonsIds: data.entry.addonsIds },
        "Addons unavailable for member",
      );
      throw new ConnectedAppRequestError(
        "addon_unavailable_for_member",
        { data },
        400,
        "One or more addons are not available for the selected member",
      );
    }

    const { customerId, ...waitlistRequestData } = data.entry;

    const customer =
      await this.props.services.customersService.getCustomer(customerId);

    if (!customer) {
      logger.error({ customerId }, "Customer not found");
      throw new ConnectedAppRequestError(
        "customer_not_found",
        { data },
        400,
        "Customer not found",
      );
    }

    const duration = data.entry.duration
      ? data.entry.duration
      : (option.durationType === "fixed"
          ? option.duration
          : option.durationMin) +
        (addons?.reduce(
          (sum, addon) =>
            sum +
            (effectiveAddonDuration(
              addon.duration,
              addon.staff,
              memberIdForAddons,
            ) || 0),
          0,
        ) ?? 0);

    const waitlistRequest: WaitlistRequest = {
      ...waitlistRequestData,
      memberId: memberIdForAddons,
      duration,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
    };

    logger.debug({ waitlistRequest }, "Creating waitlist entry");
    const source: EventSource = { actor: "member", actorId: memberId };
    const result = await repositoryService.createWaitlistEntry(
      waitlistRequest,
      source,
    );
    logger.debug({ result }, "Waitlist entry created");
    return result;
  }

  private async createWaitlistEntry(
    appData: ConnectedAppData<WaitlistConfiguration>,
    entry: WaitlistRequest,
  ): Promise<WaitlistEntry> {
    const logger = this.loggerFactory("createWaitlistEntry");
    logger.debug({ entry }, "Creating waitlist entry");

    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );
    const result = await repositoryService.createWaitlistEntry(entry, {
      actor: "customer",
    });
    logger.debug({ result }, "Waitlist entry created");

    return result;
  }

  private async processDismissWaitlistEntriesRequest(
    appData: ConnectedAppData,
    data: DismissWaitlistEntriesAction,
    memberId: string,
  ) {
    const logger = this.loggerFactory("processDismissWaitlistEntriesRequest");
    logger.debug(
      { appId: appData._id },
      "Processing dismiss waitlist entries request",
    );

    try {
      const repositoryService = this.getRepositoryService(
        appData._id,
        appData.organizationId,
      );
      const source: EventSource = { actor: "member", actorId: memberId };
      const result = await repositoryService.dismissWaitlistEntries(
        data.ids,
        source,
      );
      logger.debug(
        { appId: appData._id },
        "Successfully dismissed waitlist entries",
      );
      return result;
    } catch (error: any) {
      logger.error(
        { appId: appData._id, error },
        "Error dismissing waitlist entries",
      );
      throw error;
    }
  }

  private async processGetWaitlistEntryRequest(
    appData: ConnectedAppData,
    data: GetWaitlistEntryAction,
  ) {
    const logger = this.loggerFactory("processGetWaitlistEntryRequest");
    logger.debug(
      { appId: appData._id },
      "Processing get waitlist entry request",
    );

    try {
      const repositoryService = this.getRepositoryService(
        appData._id,
        appData.organizationId,
      );
      const result = await repositoryService.getWaitlistEntry(data.id);
      logger.debug(
        { appId: appData._id },
        "Successfully retrieved waitlist entry",
      );
      return result;
    } catch (error: any) {
      logger.error(
        { appId: appData._id, error },
        "Error retrieving waitlist entry",
      );
      throw error;
    }
  }

  private async processGetWaitlistEntriesRequest(
    appData: ConnectedAppData,
    data: GetWaitlistEntriesAction,
    user: SessionUser,
  ) {
    const logger = this.loggerFactory("processGetWaitlistEntriesRequest");
    logger.debug(
      { appId: appData._id },
      "Processing get waitlist entries request",
    );

    try {
      const repositoryService = this.getRepositoryService(
        appData._id,
        appData.organizationId,
      );

      const requestedMemberId = data.query.memberId;
      const memberId = gateMemberIds(
        user,
        requestedMemberId === undefined
          ? undefined
          : Array.isArray(requestedMemberId)
            ? requestedMemberId
            : [requestedMemberId],
      );

      const result = await repositoryService.getWaitlistEntries({
        ...data.query,
        memberId,
      });
      logger.debug(
        { appId: appData._id },
        "Successfully retrieved waitlist entries",
      );
      return result;
    } catch (error: any) {
      logger.error(
        { appId: appData._id, error },
        "Error retrieving waitlist entries",
      );
      throw error;
    }
  }

  private async processSetConfigurationRequest(
    appData: ConnectedAppData,
    data: SetConfigurationAction["configuration"],
    user: SessionUser,
  ): Promise<
    ConnectedAppStatusWithText<WaitlistAdminNamespace, WaitlistAdminKeys>
  > {
    const logger = this.loggerFactory("processSetConfigurationRequest");
    logger.debug(
      { appId: appData._id },
      "Processing set configuration request",
    );

    if (!hasPermission(user, "settings", "update")) {
      throw new ConnectedAppRequestError(
        "forbidden",
        { appId: appData._id },
        403,
        "Missing permission to update waitlist settings",
      );
    }

    try {
      // Validate configuration
      const validatedConfig = waitlistConfigurationSchema.parse(data);

      logger.debug(
        { appId: appData._id },
        "Configuration validated successfully",
      );

      const status: ConnectedAppStatusWithText<
        WaitlistAdminNamespace,
        WaitlistAdminKeys
      > = {
        status: "connected",
        statusText:
          "app_waitlist_admin.statusText.successfully_set_up" satisfies WaitlistAdminAllKeys,
      };

      this.props.update({
        data: validatedConfig,
        ...status,
      });

      logger.info(
        { appId: appData._id, status: status.status },
        "Successfully configured waitlist",
      );

      return status;
    } catch (error: any) {
      if (error instanceof ConnectedAppRequestError) {
        throw error;
      }

      logger.error(
        { appId: appData._id, error },
        "Error processing waitlist configuration",
      );

      this.props.update({
        status: "failed",
        statusText:
          "app_waitlist_admin.statusText.error_processing_configuration" satisfies WaitlistAdminAllKeys,
      });

      throw error;
    }
  }
}
