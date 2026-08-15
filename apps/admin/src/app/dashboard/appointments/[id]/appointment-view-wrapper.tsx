import { getI18nAsync } from "@hacado/i18n/server";
import { Breadcrumbs, Heading } from "@hacado/ui";
import {
  AppointmentView,
  AppointmentViewButtons,
  AppointmentViewProvider,
} from "@hacado/ui-admin-kit";
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
    { title: appointment.option.name, link: "/dashboard/appointments" },
  ];

  return (
    <AppointmentViewProvider appointment={appointment}>
      <div className="flex flex-1 flex-col gap-4">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex flex-row gap-4 justify-between">
          <Heading
            title={appointment.option.name}
            description={t("appointments.detail.by", {
              name: appointment.fields.name,
            })}
          />
          <AppointmentViewButtons />
        </div>
        <AppointmentView />
        {shouldShowDeclineModal && (
          <AppointmentDeclineDialogWrapper appointment={appointment} />
        )}
      </div>
    </AppointmentViewProvider>
  );
};
