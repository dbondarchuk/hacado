import { Appointment } from "@hacado/types";
import { DateTime } from "luxon";
import { AppointmentNotification } from "./models";

export const calculateAppointmentNotificationTime = (
  appointmentNotification: AppointmentNotification,
  appointment: Appointment,
) => {
  const dateTime = DateTime.fromJSDate(appointment.dateTime).setZone(
    appointment.timeZone,
  );

  switch (appointmentNotification.type) {
    case "timeBefore":
      return dateTime.minus({
        weeks: appointmentNotification.weeks ?? 0,
        days: appointmentNotification.days ?? 0,
        hours: appointmentNotification.hours ?? 0,
        minutes: appointmentNotification.minutes ?? 0,
      });
    case "timeAfter":
      return dateTime.plus({
        weeks: appointmentNotification.weeks ?? 0,
        days: appointmentNotification.days ?? 0,
        hours: appointmentNotification.hours ?? 0,
        minutes: appointmentNotification.minutes ?? 0,
      });
    case "atTimeBefore":
      return dateTime
        .minus({
          weeks: appointmentNotification.weeks ?? 0,
          days: appointmentNotification.days ?? 0,
        })
        .set({
          hour: appointmentNotification.time.hour ?? 0,
          minute: appointmentNotification.time.minute ?? 0,
        });
    case "atTimeAfter":
      return dateTime
        .plus({
          weeks: appointmentNotification.weeks ?? 0,
          days: appointmentNotification.days ?? 0,
        })
        .set({
          hour: appointmentNotification.time.hour ?? 0,
          minute: appointmentNotification.time.minute ?? 0,
        });
    default:
      throw new Error(
        `Unsupported appointment notification type: ${(appointmentNotification as any).type}`,
      );
  }
};

export const compareAppointmentCount = (
  appointmentNotification: AppointmentNotification,
  appointmentCount: number,
) => {
  if (
    appointmentNotification.appointmentCount &&
    appointmentNotification.appointmentCount.type !== "none" &&
    appointmentNotification.appointmentCount.count
  ) {
    switch (appointmentNotification.appointmentCount.type) {
      case "lessThan":
        return (
          appointmentCount < appointmentNotification.appointmentCount.count
        );
      case "equalTo":
        return (
          appointmentCount === appointmentNotification.appointmentCount.count
        );
      case "greaterThan":
        return (
          appointmentCount > appointmentNotification.appointmentCount.count
        );
      case "lessThanOrEqualTo":
        return (
          appointmentCount <= appointmentNotification.appointmentCount.count
        );
      case "greaterThanOrEqualTo":
        return (
          appointmentCount >= appointmentNotification.appointmentCount.count
        );
    }
  }
  return true;
};
