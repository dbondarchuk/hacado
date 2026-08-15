import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  ApiRequest,
  ApiResponse,
  Appointment,
  ConnectedAppData,
  ConnectedAppStatusWithText,
  CUSTOMER_SESSION_COOKIE,
  IConnectedApp,
  IConnectedAppProps,
  readCookieValue,
} from "@hacado/types";
import {
  MyCabinetAdminAllKeys,
  MyCabinetAdminKeys,
  MyCabinetAdminNamespace,
} from "./translations/types";

export class MyCabinetConnectedApp implements IConnectedApp {
  protected readonly loggerFactory: LoggerFactory;

  constructor(private readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "MyCabinetConnectedApp",
      props.organizationId,
    );
  }

  public async processRequest(
    appData: ConnectedAppData,
  ): Promise<
    ConnectedAppStatusWithText<MyCabinetAdminNamespace, MyCabinetAdminKeys>
  > {
    const logger = this.loggerFactory("processRequest");
    logger.debug({ appId: appData._id }, "Connecting My Cabinet app");

    const status: ConnectedAppStatusWithText<
      MyCabinetAdminNamespace,
      MyCabinetAdminKeys
    > = {
      status: "connected",
      statusText:
        "app_my-cabinet_admin.statusText.successfully_set_up" satisfies MyCabinetAdminAllKeys,
    };

    await this.props.update({ ...status });

    logger.info({ appId: appData._id }, "My Cabinet app connected");
    return status;
  }

  public async processAppCall(
    appData: ConnectedAppData,
    slug: string[],
    request: ApiRequest,
  ): Promise<ApiResponse> {
    const action = slug.join("/");
    const logger = this.loggerFactory("processAppCall");
    logger.debug(
      { appId: appData._id, action, method: request.method },
      "Processing My Cabinet app call",
    );

    if (request.method === "GET" && action === "cabinet/appointments") {
      return this.getAppointments(appData, request);
    }

    if (request.method === "GET" && action === "cabinet/appointments/summary") {
      return this.getAppointmentsSummary(appData, request);
    }

    if (
      request.method === "GET" &&
      action === "cabinet/appointments/upcoming"
    ) {
      return this.getUpcomingAppointments(appData, request);
    }

    if (request.method === "GET" && action === "cabinet/appointments/past") {
      return this.getPastAppointments(appData, request);
    }

    if (request.method === "GET" && action === "cabinet/me") {
      return this.getCustomerMe(appData, request);
    }

    const appointmentByIdMatch = action.match(
      /^cabinet\/appointments\/([^/]+)$/,
    );
    if (request.method === "GET" && appointmentByIdMatch) {
      return this.getAppointmentById(appData, request, appointmentByIdMatch[1]);
    }

    logger.warn({ appId: appData._id, action }, "Unknown My Cabinet app call");

    return Response.json(
      { success: false, error: "not_found" },
      { status: 404 },
    );
  }

  private async getAppointments(
    appData: ConnectedAppData,
    request: Request,
  ): Promise<Response> {
    const authorized = await this.authorizeSession(
      appData,
      request,
      "getAppointments",
    );

    const logger = this.loggerFactory("getAppointments");
    if (authorized instanceof Response) {
      logger.warn(
        { appId: appData._id, error: "unauthorized" },
        "Unauthorized cabinet request",
      );
      return authorized;
    }

    const now = new Date();
    const [upcoming, past] = await Promise.all([
      this.props.services.bookingService.getAppointments({
        customerId: authorized.customerId,
        range: { start: now },
        limit: 20,
        sort: [{ id: "dateTime", desc: false }],
      }),
      this.props.services.bookingService.getAppointments({
        customerId: authorized.customerId,
        range: { end: now },
        limit: 20,
        sort: [{ id: "dateTime", desc: true }],
      }),
    ]);

    logger.debug(
      {
        appId: appData._id,
        customerId: authorized.customerId,
        upcomingCount: upcoming.items.length,
        pastCount: past.items.length,
      },
      "Returning cabinet appointments",
    );

    const customer = await this.props.services.customersService.getCustomer(
      authorized.customerId,
    );

    return Response.json({
      success: true,
      customerId: authorized.customerId,
      customer: customer ? { name: customer.name } : undefined,
      upcoming: upcoming.items.map((a) => this.sanitizeAppointment(a)),
      past: past.items.map((a) => this.sanitizeAppointment(a)),
    });
  }

  private async getAppointmentsSummary(
    appData: ConnectedAppData,
    request: Request,
  ): Promise<Response> {
    const authorized = await this.authorizeSession(
      appData,
      request,
      "getAppointmentsSummary",
    );
    if (authorized instanceof Response) return authorized;

    const now = new Date();
    const [upcoming, past] = await Promise.all([
      this.props.services.bookingService.getAppointments({
        customerId: authorized.customerId,
        status: ["confirmed", "pending"],
        range: { start: now },
        limit: 1,
      }),
      this.props.services.bookingService.getAppointments({
        customerId: authorized.customerId,
        range: { end: now },
        limit: 1,
      }),
    ]);

    return Response.json({
      success: true,
      upcomingCount: upcoming.total ?? upcoming.items.length,
      pastCount: past.total ?? past.items.length,
    });
  }

  private async getUpcomingAppointments(
    appData: ConnectedAppData,
    request: Request,
  ): Promise<Response> {
    const authorized = await this.authorizeSession(
      appData,
      request,
      "getUpcomingAppointments",
    );
    if (authorized instanceof Response) return authorized;

    const now = new Date();
    const upcoming = await this.props.services.bookingService.getAppointments({
      customerId: authorized.customerId,
      range: { start: now },
      limit: 20,
      sort: [{ id: "dateTime", desc: false }],
    });

    return Response.json({
      success: true,
      items: upcoming.items.map((a) => this.sanitizeAppointment(a)),
      total: upcoming.total,
    });
  }

  private async getPastAppointments(
    appData: ConnectedAppData,
    request: Request,
  ): Promise<Response> {
    const authorized = await this.authorizeSession(
      appData,
      request,
      "getPastAppointments",
    );
    if (authorized instanceof Response) return authorized;

    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const limit = Math.min(
      20,
      Math.max(1, Number(url.searchParams.get("limit") ?? 10)),
    );
    const offset = (page - 1) * limit;
    const now = new Date();
    const past = await this.props.services.bookingService.getAppointments({
      customerId: authorized.customerId,
      range: { end: now },
      limit,
      offset,
      sort: [{ id: "dateTime", desc: true }],
    });
    const total = past.total ?? past.items.length;

    return Response.json({
      success: true,
      items: past.items.map((a) => this.sanitizeAppointment(a)),
      total,
      page,
      limit,
      hasNextPage: page * limit < total,
    });
  }

  private async getCustomerMe(
    appData: ConnectedAppData,
    request: Request,
  ): Promise<Response> {
    const authorized = await this.authorizeSession(
      appData,
      request,
      "getCustomerMe",
    );
    if (authorized instanceof Response) return authorized;

    const customer = await this.props.services.customersService.getCustomer(
      authorized.customerId,
    );

    if (!customer) {
      return Response.json(
        { success: false, error: "not_found" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      id: customer._id,
    });
  }

  private async getAppointmentById(
    appData: ConnectedAppData,
    request: Request,
    appointmentId: string,
  ): Promise<Response> {
    const authorized = await this.authorizeSession(
      appData,
      request,
      "getAppointmentById",
    );
    if (authorized instanceof Response) return authorized;

    const appointment =
      await this.props.services.bookingService.getAppointment(appointmentId);

    if (!appointment || appointment.customerId !== authorized.customerId) {
      return Response.json(
        { success: false, error: "not_found" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      appointment: this.sanitizeAppointment(appointment),
    });
  }

  private sanitizeAppointment(appointment: Appointment) {
    return {
      _id: appointment._id,
      status: appointment.status,
      dateTime: appointment.dateTime,
      endAt: appointment.endAt,
      totalDuration: appointment.totalDuration,
      totalPrice: appointment.totalPrice,
      timeZone: appointment.timeZone,
      meetingInformation: appointment.meetingInformation,
      option: appointment.option
        ? { _id: appointment.option._id, name: appointment.option.name }
        : undefined,
      addons: appointment.addons?.map((a) => ({ _id: a._id, name: a.name })),
      fields: {
        name: appointment.fields.name,
        email: appointment.fields.email,
        phone: appointment.fields.phone,
      },
      payments: appointment.payments?.map((p) => ({
        amount: p.amount,
        paidAt: p.paidAt,
        status: p.status,
        type: p.type,
        method: p.method,
        refunds: p.refunds,
        ...("giftCardCode" in p ? { giftCardCode: p.giftCardCode } : {}),
      })),
    };
  }

  private async authorizeSession(
    appData: ConnectedAppData,
    request: Request,
    methodName: string,
  ): Promise<Response | { customerId: string; sessionId: string }> {
    const logger = this.loggerFactory(methodName);
    const sessionToken = readCookieValue(
      request.headers.get("cookie"),
      CUSTOMER_SESSION_COOKIE,
    );

    const session =
      await this.props.services.customerAuthService.authorizeSession(
        sessionToken,
      );

    if (!session || session.organizationId !== appData.organizationId) {
      logger.warn({ appId: appData._id }, "Unauthorized cabinet request");
      return Response.json(
        { success: false, error: "unauthorized" },
        { status: 401 },
      );
    }

    return {
      customerId: session.customerId,
      sessionId: session.sessionId,
    };
  }
}
