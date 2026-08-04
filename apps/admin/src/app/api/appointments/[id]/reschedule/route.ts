import { getActor } from "@/app/utils";
import { requireCanUpdateAppointment } from "@/lib/auth/require-appointment-update";
import { getSubscriptionBlockingResponseForAppointmentWriteActions } from "@/utils/subscription/subscription-access";
import { okStatus } from "@timelish/types";
import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";

const schema = z.object({
  dateTime: z.coerce.date<Date>(),
  duration: z.coerce.number<number>().int().min(1),
  doNotNotifyCustomer: z.coerce.boolean<boolean>().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext<"/api/appointments/[id]/reschedule">,
) {
  const { id } = await params;
  const auth = await requireCanUpdateAppointment(
    id,
    "AdminAPI/appointments/[id]/reschedule",
    "PATCH",
  );
  if (!auth.ok) return auth.response;

  const logger = auth.logger;
  const servicesContainer = auth.servicesContainer;
  const eventSource = await getActor();

  logger.debug(
    {
      url: request.url,
      method: request.method,
      id,
    },
    "Processing appointment reschedule API request",
  );

  const blockedResponse =
    await getSubscriptionBlockingResponseForAppointmentWriteActions();
  if (blockedResponse) {
    return blockedResponse;
  }

  const body = await request.json();
  const { data, success, error } = schema.safeParse(body);

  if (!success) {
    logger.warn({ error }, "Invalid request format");
    return NextResponse.json(
      { success: false, error, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  await servicesContainer.bookingService.rescheduleAppointment(
    id,
    data.dateTime,
    data.duration,
    eventSource,
    data.doNotNotifyCustomer,
  );

  logger.debug(
    {
      appointmentId: id,
      dateTime: data.dateTime,
      duration: data.duration,
      doNotNotifyCustomer: data.doNotNotifyCustomer,
    },
    "Appointment rescheduled successfully",
  );

  return NextResponse.json(okStatus);
}
