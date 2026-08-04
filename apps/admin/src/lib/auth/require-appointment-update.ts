import { getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { canUpdateAppointment } from "@timelish/utils";
import { NextResponse } from "next/server";

/**
 * Require `appointment:update`, and for users without `updateAll`,
 * that the appointment belongs to their memberId.
 */
export async function requireCanUpdateAppointment(
  appointmentId: string,
  logName: string,
  method: string,
) {
  const auth = await requirePermission(
    "appointment",
    "update",
    logName,
    method,
  );
  if (!auth.ok) return auth;

  const servicesContainer = await getServicesContainer();
  const appointment =
    await servicesContainer.bookingService.getAppointment(appointmentId);

  if (!appointment) {
    auth.logger.warn({ appointmentId }, "Appointment not found");
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: "Appointment not found",
          code: "appointment_not_found",
        },
        { status: 404 },
      ),
    };
  }

  if (!canUpdateAppointment(auth.user, appointment.memberId)) {
    auth.logger.warn(
      {
        role: auth.user.role,
        appointmentId,
        appointmentMemberId: appointment.memberId,
        userMemberId: auth.user.memberId,
      },
      "Forbidden: cannot update another member's appointment",
    );
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, code: "forbidden", error: "Forbidden" },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true as const,
    session: auth.session,
    user: auth.user,
    logger: auth.logger,
    appointment,
    servicesContainer,
  };
}
