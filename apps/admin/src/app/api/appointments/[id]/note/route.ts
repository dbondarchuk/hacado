import { requireCanUpdateAppointment } from "@/lib/auth/require-appointment-update";
import { okStatus } from "@timelish/types";
import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";

const schema = z.object({
  note: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext<"/api/appointments/[id]/note">,
) {
  const { id } = await params;
  const auth = await requireCanUpdateAppointment(
    id,
    "AdminAPI/appointments/[id]/note",
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
    "Processing appointment note update API request",
  );

  const body = await request.json();
  const { data, success, error } = schema.safeParse(body);

  if (!success) {
    logger.warn({ error }, "Invalid request format");
    return NextResponse.json(
      { success: false, error, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  await servicesContainer.bookingService.updateAppointmentNote(id, data.note);

  logger.debug(
    {
      appointmentId: id,
      note: data.note,
    },
    "Appointment note updated successfully",
  );

  return NextResponse.json(okStatus);
}
