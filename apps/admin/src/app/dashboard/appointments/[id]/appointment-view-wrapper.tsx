import { getI18nAsync } from "@hacado/i18n/server";
import {
  AppointmentView,
  AppointmentViewProvider,
} from "@hacado/ui-admin-kit/appointments";
import { Breadcrumbs } from "@hacado/ui/breadcrumbs";
import { notFound } from "next/navigation";
import React from "react";
import { AppointmentDeclineDialogWrapper } from "./appointment-decline-dialog";
import { getAppointment } from "./cached";

export const AppointmentViewWrapper: React.FC<{
  appointmentId: string;
  shouldShowDeclineModal?: boolean;
}> = async ({ appointmentId, shouldShowDeclineModal }) => {
  const t = await getI18nAsync("admin");
  const appointment = await getAppointment(appointmentId);

  if (!appointment) {
    return notFound();
  }

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    {
      title: t("navigation.appointments"),
      link: "/dashboard/appointments",
    },
    {
      title: appointment.service.name,
      mobileTitle: appointment.service.name,
      link: `/dashboard/appointments/${appointmentId}`,
    },
  ];

  return (
    <AppointmentViewProvider appointment={appointment}>
      <div className="flex min-w-0 w-full flex-1 flex-col gap-4">
        <Breadcrumbs items={breadcrumbItems} />
        <AppointmentView layout="page" />
        {shouldShowDeclineModal ? (
          <AppointmentDeclineDialogWrapper appointment={appointment} />
        ) : null}
      </div>
    </AppointmentViewProvider>
  );
};
