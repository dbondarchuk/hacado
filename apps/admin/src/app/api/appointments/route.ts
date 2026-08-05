import { getActor, getServicesContainer, getUser } from "@/app/utils";
import { getSubscriptionBlockingResponseForAppointmentWriteActions } from "@/utils/subscription/subscription-access";
import { appointmentsSearchParamsLoader } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import {
  AppointmentEvent,
  appointmentEventSchema,
  AppointmentLimitReachedError,
} from "@hacado/types";
import { gateMemberIds } from "@hacado/utils";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/appointments")("GET");
  const servicesContainer = await getServicesContainer();
  const user = await getUser();

  logger.debug(
    {
      url: request.url,
      method: request.method,
      searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    },
    "Processing appointments API request",
  );

  const params = appointmentsSearchParamsLoader(request.nextUrl.searchParams);

  const page = params.page;
  const search = params.search ?? undefined;
  const limit = params.limit;
  const sort = params.sort;
  const status = params.status ?? undefined;
  const start = params.start ?? undefined;
  const end = params.end ?? undefined;
  const referenceDate = params.referenceDate ?? undefined;
  const customerIds = params.customer ?? undefined;
  const memberIds = gateMemberIds(user, params.member ?? undefined);

  const offset = (page - 1) * limit;

  logger.debug(
    {
      page,
      search,
      limit,
      sort,
      status,
      start,
      end,
      referenceDate,
      offset,
    },
    "Fetching appointments with parameters",
  );

  const res = await servicesContainer.bookingService.getAppointments({
    offset,
    limit,
    search,
    sort,
    status,
    range: start || end ? { start, end } : undefined,
    referenceDate,
    customerId: customerIds ?? undefined,
    memberId: memberIds ?? undefined,
  });

  logger.debug(
    {
      total: res.total,
      count: res.items.length,
    },
    "Successfully retrieved appointments",
  );

  return NextResponse.json(res);
}

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/appointments")("POST");
  const servicesContainer = await getServicesContainer();
  const eventSource = await getActor();

  logger.debug(
    {
      url: request.url,
      method: request.method,
    },
    "Processing create appointment API request",
  );

  const blockedResponse =
    await getSubscriptionBlockingResponseForAppointmentWriteActions();
  if (blockedResponse) {
    return blockedResponse;
  }

  const formData = await request.formData();
  const appointmentJson = formData.get("appointment") as string;
  if (!appointmentJson) {
    return NextResponse.json(
      {
        success: false,
        error: "Appointment JSON is required",
        code: "appointment_json_required",
      },
      { status: 400 },
    );
  }

  const { data, success, error } = appointmentEventSchema.safeParse(
    JSON.parse(appointmentJson),
  );
  if (!success) {
    logger.warn({ error }, "Invalid appointment JSON");
    return NextResponse.json(
      { success: false, error, code: "invalid_appointment_json" },
      { status: 400 },
    );
  }

  const fileFields = formData.getAll("fileField") as string[];
  const files = fileFields.reduce(
    (acc, field) => ({
      ...acc,
      [field]: formData.get(`file_${field}`) as File,
    }),
    {} as Record<string, File>,
  );

  if (Object.values(files).some((file) => !file)) {
    logger.warn({ files, fileFields }, "Invalid files");
    return NextResponse.json(
      { success: false, error: "Invalid files", code: "invalid_files" },
      { status: 400 },
    );
  }

  const confirmed = formData.get("confirmed") === "true";

  const { timeZone } =
    await servicesContainer.configurationService.getConfiguration("general");
  const option = await servicesContainer.servicesService.getOption(
    data.optionId,
  );
  if (!option) {
    logger.warn({ optionId: data.optionId }, "Option not found");
    return NextResponse.json(
      { success: false, error: "Option not found", code: "option_not_found" },
      { status: 400 },
    );
  }

  if (!data.fields.name || !data.fields.email || !data.fields.phone) {
    logger.warn({ fields: data.fields }, "Fields are required");
    return NextResponse.json(
      { success: false, error: "Fields are required", code: "fields_required" },
      { status: 400 },
    );
  }

  const addons = data.addonsIds?.length
    ? await servicesContainer.servicesService.getAddonsById(data.addonsIds)
    : undefined;

  const discount = data.discount
    ? await servicesContainer.servicesService.getDiscountByCode(
        data.discount.code,
      )
    : undefined;

  const selectedFields =
    await servicesContainer.servicesService.getFieldsByNames(
      Object.keys(data.fields),
    );
  const fieldsLabels = selectedFields.reduce(
    (acc, field) => ({ ...acc, [field.name]: field.data?.label }),
    {} as Record<string, string>,
  );

  const optionDuration =
    option.durationType === "fixed"
      ? option.duration
      : (data.totalDuration ?? 0) -
        (addons?.reduce((sum, addon) => sum + (addon.duration || 0), 0) ?? 0);

  const optionPrice =
    option.durationType === "fixed"
      ? option.price
      : ((option.pricePerHour || 0) / 60) * (optionDuration || 0) -
        (addons?.reduce((sum, addon) => sum + (addon.price || 0), 0) ?? 0);

  const appointmentEvent: AppointmentEvent = {
    ...data,
    fields: Object.entries(data.fields)
      .filter(([key]) => !(key in (files || {})))
      .reduce(
        (acc, [key, value]) => ({ ...acc, [key]: value }),
        {} as AppointmentEvent["fields"],
      ),
    fieldsLabels,
    timeZone,
    option: {
      _id: option._id,
      name: option.name,
      price: optionPrice,
      duration: optionDuration,
      durationType: option.durationType,
      isOnline: option.isOnline,
    },
    addons: addons?.map((addon) => ({
      _id: addon._id,
      name: addon.name,
      price: addon.price,
      duration: addon.duration,
    })),
    discount:
      discount && data.discount
        ? {
            id: discount._id,
            name: discount.name,
            code: data.discount.code,
            discountAmount: data.discount.discountAmount,
          }
        : undefined,
  };

  let appointment;
  try {
    appointment = await servicesContainer.bookingService.createAppointment({
      event: appointmentEvent,
      confirmed,
      force: true,
      files,
      eventSource,
      memberId: data.memberId,
    });
  } catch (error) {
    if (error instanceof AppointmentLimitReachedError) {
      return NextResponse.json(
        {
          success: false,
          code: error.code,
          message: error.message,
          limit: error.limit,
          settingsUrl: "/dashboard/settings/brand?activeTab=general",
        },
        { status: 402 },
      );
    }
    throw error;
  }

  logger.debug(
    {
      appointmentId: appointment._id,
    },
    "Appointment created successfully",
  );

  return NextResponse.json(appointment, { status: 201 });
}
