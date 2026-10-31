import { Appointment } from "@hacado/types/booking";
import { DateTime } from "luxon";
import { AppointmentNotification } from "./models";

type AppointmentNotificationTiming = {
  type: AppointmentNotification["type"];
  weeks?: number | null;
  days?: number | null;
  hours?: number | null;
  minutes?: number | null;
  time?: { hour?: number | null; minute?: number | null } | null;
};

export const shiftAppointmentNotificationTime = (
  appointmentNotification: AppointmentNotificationTiming,
  appointmentDateTime: DateTime,
) => {
  const weeks = appointmentNotification.weeks ?? 0;
  const days = appointmentNotification.days ?? 0;
  const hours = appointmentNotification.hours ?? 0;
  const minutes = appointmentNotification.minutes ?? 0;

  switch (appointmentNotification.type) {
    case "timeBefore":
      return appointmentDateTime.minus({ weeks, days, hours, minutes });
    case "timeAfter":
      return appointmentDateTime.plus({ weeks, days, hours, minutes });
    case "atTimeBefore":
      return appointmentDateTime.minus({ weeks, days }).set({
        hour: appointmentNotification.time?.hour ?? 0,
        minute: appointmentNotification.time?.minute ?? 0,
        second: 0,
        millisecond: 0,
      });
    case "atTimeAfter":
      return appointmentDateTime.plus({ weeks, days }).set({
        hour: appointmentNotification.time?.hour ?? 0,
        minute: appointmentNotification.time?.minute ?? 0,
        second: 0,
        millisecond: 0,
      });
    default:
      throw new Error(
        `Unsupported appointment notification type: ${(appointmentNotification as { type?: string }).type}`,
      );
  }
};

export const calculateAppointmentNotificationTime = (
  appointmentNotification: AppointmentNotification,
  appointment: Appointment,
) => {
  return shiftAppointmentNotificationTime(
    appointmentNotification,
    DateTime.fromJSDate(appointment.dateTime).setZone(appointment.timeZone),
  );
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
