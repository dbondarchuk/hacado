import { getActor, getServicesContainer, getUser } from "@/app/utils";
import { getSubscriptionBlockingResponseForAppointmentWriteActions } from "@/utils/subscription/subscription-access";
import { appointmentsSearchParamsLoader } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import {
  AppointmentEvent,
  appointmentEventSchema,
  AppointmentLimitReachedError,
  effectiveAddonDuration,
  effectiveAddonPrice,
  effectiveStaffDuration,
  effectiveStaffPrice,
  getUnassignedMemberIssues,
  isMemberAssignedToOption,
  PackageError,
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
  const packageIds = params.package ?? undefined;
  const customerPackageId = params.customerPackageId ?? undefined;
  const discountIds = params.discount ?? undefined;

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
      customerPackageId,
      packageIds,
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
    discountId: discountIds ?? undefined,
    packageId: packageIds ?? undefined,
    customerPackageId,
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

  const unassignedIssues = getUnassignedMemberIssues({
    optionStaff: option.staff,
    addons,
    memberId: data.memberId,
  });
  if (
    unassignedIssues.needsAcknowledgement &&
    !data.acknowledgeUnassignedMember
  ) {
    logger.warn(
      {
        memberId: data.memberId,
        optionUnassigned: unassignedIssues.optionUnassigned,
        unassignedAddonNames: unassignedIssues.unassignedAddonNames,
      },
      "Unassigned member acknowledgement required",
    );
    return NextResponse.json(
      {
        success: false,
        error:
          "Acknowledgement is required when the selected member is not assigned to the option or one or more addons",
        code: "acknowledge_unassigned_member_required",
      },
      { status: 400 },
    );
  }

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

  const staffAssignment =
    data.memberId && isMemberAssignedToOption(option.staff, data.memberId)
      ? option.staff?.find(
          (assignment) => assignment.memberId === data.memberId,
        )
      : undefined;

  const addonsDuration =
    addons?.reduce(
      (sum, addon) =>
        sum +
        (effectiveAddonDuration(addon.duration, addon.staff, data.memberId) ||
          0),
      0,
    ) ?? 0;
  const addonsPrice =
    addons?.reduce(
      (sum, addon) =>
        sum +
        (effectiveAddonPrice(addon.price, addon.staff, data.memberId) || 0),
      0,
    ) ?? 0;

  const optionDuration =
    option.durationType === "fixed"
      ? (effectiveStaffDuration(option.duration, staffAssignment) ?? 0)
      : (data.totalDuration ?? 0) - addonsDuration;

  const optionPrice =
    option.durationType === "fixed"
      ? effectiveStaffPrice(option.price, staffAssignment)
      : ((effectiveStaffPrice(option.pricePerHour, staffAssignment) || 0) /
          60) *
          (optionDuration || 0) -
        addonsPrice;

  const {
    acknowledgeUnassignedMember: _acknowledgeUnassignedMember,
    customerPackageId,
    ...eventData
  } = data;

  const appointmentEvent: AppointmentEvent = {
    ...eventData,
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
    addons: customerPackageId
      ? undefined
      : addons?.map((addon) => ({
          _id: addon._id,
          name: addon.name,
          price: effectiveAddonPrice(addon.price, addon.staff, data.memberId),
          duration: effectiveAddonDuration(
            addon.duration,
            addon.staff,
            data.memberId,
          ),
        })),
    discount:
      customerPackageId || !discount || !data.discount
        ? undefined
        : {
            id: discount._id,
            name: discount.name,
            code: data.discount.code,
            discountAmount: data.discount.discountAmount,
          },
    totalPrice: customerPackageId ? 0 : eventData.totalPrice,
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
      customerPackageId,
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
    if (error instanceof PackageError) {
      return NextResponse.json(
        {
          success: false,
          code: error.code,
          message: error.message,
        },
        { status: 400 },
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
