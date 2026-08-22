import { requireCanUpdateAppointment } from "@/lib/auth/require-appointment-update";
import { getLoggerFactory } from "@hacado/logger";
import { okStatus } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";

const schema = z.object({
  note: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext<"/api/appointments/[id]/note">,
) {
  const logger = getLoggerFactory("AdminAPI/appointments/[id]/note")("PATCH");
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
