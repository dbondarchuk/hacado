import { getActor } from "@/app/utils";
import { requireCanUpdateAppointment } from "@/lib/auth/require-appointment-update";
import { getSubscriptionBlockingResponseForAppointmentWriteActions } from "@/utils/subscription/subscription-access";
import { appointmentStatuses, okStatus } from "@timelish/types";
import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";

const schema = z.object({
  status: z.enum(appointmentStatuses).exclude(["pending"]),
  /** When true, attributes the change to the customer (e.g. cancel link). Otherwise the signed-in admin user. */
  requestedByCustomer: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext<"/api/appointments/[id]/status">,
) {
  const { id } = await params;
  const auth = await requireCanUpdateAppointment(
    id,
    "AdminAPI/appointments/[id]/status",
    "PATCH",
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

  const eventSource = data.requestedByCustomer
    ? ({ actor: "customer" } as const)
    : await getActor();

  await servicesContainer.bookingService.changeAppointmentStatus(
    id,
    data.status,
    eventSource,
  );

  logger.debug(
    {
      appointmentId: id,
      newStatus: data.status,
      requestedByCustomer: data.requestedByCustomer ?? false,
    },
    "Appointment status changed successfully",
  );

  return NextResponse.json(okStatus);
}
