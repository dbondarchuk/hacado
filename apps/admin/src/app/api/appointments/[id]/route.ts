import { getActor, getServicesContainer } from "@/app/utils";
import { requireCanUpdateAppointment } from "@/lib/auth/require-appointment-update";
import { getLoggerFactory } from "@hacado/logger";
import {
  AppointmentEvent,
  appointmentEventSchema,
  effectiveAddonDuration,
  effectiveAddonPrice,
  effectiveStaffDuration,
  effectiveStaffPrice,
  getUnassignedMemberIssues,
  isMemberAssignedToOption,
} from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/appointments/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/appointments/[id]")("GET");
  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  logger.debug(
    {
      url: request.url,
      method: request.method,
      id,
    },
    "Processing get appointment API request",
  );

  const appointment = await servicesContainer.bookingService.getAppointment(id);

  if (!appointment) {
    logger.warn({ id }, "Appointment not found");
    return NextResponse.json(
      {
        success: false,
        error: "Appointment not found",
        code: "appointment_not_found",
      },
      { status: 404 },
    );
  }

  logger.debug(
    {
      appointmentId: appointment._id,
    },
    "Appointment retrieved successfully",
  );

  return NextResponse.json(appointment, { status: 200 });
}

export async function PUT(
  request: NextRequest,
  { params }: RouteContext<"/api/appointments/[id]">,
) {
  const { id } = await params;
  const auth = await requireCanUpdateAppointment(
    id,
    "AdminAPI/appointments/[id]",
    "PUT",
  );
  if (!auth.ok) return auth.response;

  const logger = auth.logger;
  const servicesContainer = auth.servicesContainer;

  logger.debug(
    {
      url: request.url,
      method: request.method,
      id,
    },
    "Processing update appointment API request",
  );

  const eventSource = await getActor();
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
  const doNotNotifyCustomer = formData.get("doNotNotifyCustomer") === "true";

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

  const memberId = data.memberId ?? auth.appointment.memberId;

  const unassignedIssues = getUnassignedMemberIssues({
    optionStaff: option.staff,
    addons,
    memberId,
  });
  if (
    unassignedIssues.needsAcknowledgement &&
    !data.acknowledgeUnassignedMember
  ) {
    logger.warn(
      {
        memberId,
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
    memberId && isMemberAssignedToOption(option.staff, memberId)
      ? option.staff?.find((assignment) => assignment.memberId === memberId)
      : undefined;

  const addonsDuration =
    addons?.reduce(
      (sum, addon) =>
        sum +
        (effectiveAddonDuration(addon.duration, addon.staff, memberId) || 0),
      0,
    ) ?? 0;
  const addonsPrice =
    addons?.reduce(
      (sum, addon) =>
        sum + (effectiveAddonPrice(addon.price, addon.staff, memberId) || 0),
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
    addons: addons?.map((addon) => ({
      _id: addon._id,
      name: addon.name,
      price: effectiveAddonPrice(addon.price, addon.staff, memberId),
      duration: effectiveAddonDuration(addon.duration, addon.staff, memberId),
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

  const appointment = await servicesContainer.bookingService.updateAppointment(
    id,
    {
      event: appointmentEvent,
      confirmed,
      files,
      doNotNotifyCustomer,
      eventSource,
    },
  );

  logger.debug(
    {
      appointmentId: appointment._id,
    },
    "Appointment updated successfully",
  );

  return NextResponse.json(appointment, { status: 200 });
}
