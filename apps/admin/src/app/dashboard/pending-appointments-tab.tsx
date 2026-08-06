import { getServicesContainer, getSession } from "@/app/utils";
import { getI18nAsync } from "@hacado/i18n/server";
import { Card, CardContent, CardHeader } from "@hacado/ui";
import { AppointmentCard } from "@hacado/ui-admin-kit";
import {
  canUpdateAppointments,
  resolveUpdatableAppointmentMemberId,
} from "@hacado/utils";
import { DateTime } from "luxon";
import { redirect } from "next/navigation";
import React from "react";

export const PendingAppointmentsTab: React.FC = async () => {
  const session = await getSession();
  if (!canUpdateAppointments(session?.user)) {
    redirect("/dashboard");
  }

  const t = await getI18nAsync("admin");
  const servicesContainer = await getServicesContainer();
  const beforeNow = DateTime.now().minus({ hours: 1 }).toJSDate();
  const memberId = resolveUpdatableAppointmentMemberId(session.user);
  const pendingAppointments =
    await servicesContainer.bookingService.getPendingAppointments(
      20,
      beforeNow,
      memberId,
    );

  const { timeZone } =
    await servicesContainer.configurationService.getConfiguration("general");

  return (
    <>
      {pendingAppointments.total === 0 ? (
        <Card>
          <CardHeader className="flex text-center font-medium text-xl">
            {t("dashboard.appointments.noPendingAppointments")}
          </CardHeader>
          <CardContent className="flex justify-center py-4">
            {t("dashboard.appointments.caughtUp")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:flex xl:flex-wrap gap-2">
          {pendingAppointments.items.map((appointment) => (
            <AppointmentCard
              key={appointment._id}
              timeZone={timeZone}
              appointment={appointment}
            />
          ))}
        </div>
      )}
    </>
  );
};
