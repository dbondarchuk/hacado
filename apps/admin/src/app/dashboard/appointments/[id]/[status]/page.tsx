import { getActor, getServicesContainer, getSession } from "@/app/utils";
import { getLoggerFactory } from "@timelish/logger";
import { canUpdateAppointment } from "@timelish/utils";
import { forbidden, notFound, redirect } from "next/navigation";

type Props = PageProps<"/dashboard/appointments/[id]/[status]">;

export default async function Page(props: Props) {
  const logger = getLoggerFactory("AdminPages")("appointment-status-change");
  const params = await props.params;
  const actor = await getActor();
  const [servicesContainer, session] = await Promise.all([
    getServicesContainer(),
    getSession(),
  ]);
  logger.debug(
    {
      appointmentId: params.id,
      status: params.status,
    },
    "Processing appointment status change",
  );

  const appointment = await servicesContainer.bookingService.getAppointment(
    params.id,
  );
  if (!appointment) {
    return notFound();
  }
  if (!canUpdateAppointment(session.user, appointment.memberId)) {
    forbidden();
  }

  switch (params.status) {
    case "confirm":
      await servicesContainer.bookingService.changeAppointmentStatus(
        params.id,
        "confirmed",
        actor,
      );

      logger.debug(
        {
          appointmentId: params.id,
          newStatus: "confirmed",
        },
        "Appointment confirmed, redirecting",
      );

      redirect(`/dashboard/appointments/${params.id}`);

    case "decline":
      // await ServicesContainer.bookingService().changeAppointmentStatus(
      //   params.id,
      //   "declined"
      // );

      logger.debug(
        {
          appointmentId: params.id,
          action: "decline",
        },
        "Appointment decline requested, redirecting with decline modal",
      );

      redirect(`/dashboard/appointments/${params.id}?decline`);

    default:
      return notFound();
  }
}
