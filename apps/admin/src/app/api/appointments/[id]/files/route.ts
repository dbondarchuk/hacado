import { getActor } from "@/app/utils";
import { requireCanUpdateAppointment } from "@/lib/auth/require-appointment-update";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/appointments/[id]/files">,
) {
  const logger = getLoggerFactory("AdminAPI/appointments/[id]/files")("POST");
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
    "Processing appointment files add API request",
  );

  const formData = await request.formData();
  const files = formData.getAll("file") as File[];

  if (!files.length) {
    logger.warn({ appointmentId: id }, "No files provided");
    return NextResponse.json(
      { success: false, error: "No files provided", code: "no_files_provided" },
      { status: 400 },
    );
  }

  const actor = await getActor();
  const result = await servicesContainer.bookingService.addAppointmentFiles(
    id,
    files,
    actor,
  );

  logger.debug(
    {
      appointmentId: id,
      fileCount: files.length,
      assetCount: result.length,
    },
    "Appointment files added successfully",
  );

  return NextResponse.json(result);
}
