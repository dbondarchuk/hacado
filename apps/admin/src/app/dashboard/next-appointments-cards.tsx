import { getI18nAsync } from "@timelish/i18n/server";
import { Card, CardContent, cn } from "@timelish/ui";
import { AppointmentCard } from "@timelish/ui-admin-kit";
import { DateTime } from "luxon";
import React from "react";
import { getServicesContainer } from "../utils";

export const NextAppointmentsCards: React.FC<{
  className?: string;
  memberId?: string;
}> = async ({ className, memberId }) => {
  const t = await getI18nAsync("admin");
  const servicesContainer = await getServicesContainer();
  const nextAppointments =
    await servicesContainer.bookingService.getNextAppointments(
      DateTime.now().toJSDate(),
      3,
      memberId,
    );

  const { timeZone } =
    await servicesContainer.configurationService.getConfiguration("general");

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {!nextAppointments.length && (
        <Card>
          <CardContent className="flex justify-center py-4">
            {t("dashboard.appointments.noAppointments")}
          </CardContent>
        </Card>
      )}
      {nextAppointments.map((appointment) => (
        <AppointmentCard
          appointment={appointment}
          timeZone={timeZone}
          key={appointment._id}
        />
      ))}
    </div>
  );
};
