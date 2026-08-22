import { getActor } from "@/app/utils";
import { requireCanUpdateAppointment } from "@/lib/auth/require-appointment-update";
import { getSubscriptionBlockingResponseForAppointmentWriteActions } from "@/utils/subscription/subscription-access";
import { getLoggerFactory } from "@hacado/logger";
import { appointmentStatuses, okStatus } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";

const schema = z.object({
  status: z.enum(appointmentStatuses).exclude(["pending"]),
  doNotNotifyCustomer: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext<"/api/appointments/[id]/status">,
) {
  const logger = getLoggerFactory("AdminAPI/appointments/[id]/status")("PATCH");
  const { id } = await params;
  const auth = await requireCanUpdateAppointment(id, logger);
  if (!auth.ok) return auth.response;

  const servicesContainer = auth.servicesContainer;

  logger.debug(
    {
      url: request.url,
      method: request.method,
      id,
    },
    "Processing appointment status update API request",
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

  const eventSource = await getActor();

  await servicesContainer.bookingService.changeAppointmentStatus(
    id,
    data.status,
    eventSource,
    data.doNotNotifyCustomer,
  );

  logger.debug(
    {
      appointmentId: id,
      newStatus: data.status,
      doNotNotifyCustomer: data.doNotNotifyCustomer ?? false,
    },
    "Appointment status changed successfully",
  );

  return NextResponse.json(okStatus);
}
