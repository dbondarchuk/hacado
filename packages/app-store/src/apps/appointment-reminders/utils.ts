import { Appointment } from "@hacado/types/booking";
import { DateTime } from "luxon";
import { AppointmentReminder } from "./models";

type AppointmentReminderTiming = {
  type: AppointmentReminder["type"];
  weeks?: number | null;
  days?: number | null;
  hours?: number | null;
  minutes?: number | null;
  time?: { hour?: number | null; minute?: number | null } | null;
};

export const shiftAppointmentReminderTime = (
  appointmentReminder: AppointmentReminderTiming,
  appointmentDateTime: DateTime,
) => {
  const weeks = appointmentReminder.weeks ?? 0;
  const days = appointmentReminder.days ?? 0;
  const hours = appointmentReminder.hours ?? 0;
  const minutes = appointmentReminder.minutes ?? 0;

  switch (appointmentReminder.type) {
    case "timeBefore":
      return appointmentDateTime.minus({ weeks, days, hours, minutes });
    case "timeAfter":
      return appointmentDateTime.plus({ weeks, days, hours, minutes });
    case "atTimeBefore":
      return appointmentDateTime.minus({ weeks, days }).set({
        hour: appointmentReminder.time?.hour ?? 0,
        minute: appointmentReminder.time?.minute ?? 0,
        second: 0,
        millisecond: 0,
      });
    case "atTimeAfter":
      return appointmentDateTime.plus({ weeks, days }).set({
        hour: appointmentReminder.time?.hour ?? 0,
        minute: appointmentReminder.time?.minute ?? 0,
        second: 0,
        millisecond: 0,
      });
    default:
      throw new Error(
        `Unsupported appointment reminder type: ${(appointmentReminder as { type?: string }).type}`,
      );
  }
};

export const calculateAppointmentReminderTime = (
  appointmentReminder: AppointmentReminder,
  appointment: Appointment,
) => {
  return shiftAppointmentReminderTime(
    appointmentReminder,
    DateTime.fromJSDate(appointment.dateTime).setZone(appointment.timeZone),
  );
};

export const compareAppointmentCount = (
  appointmentReminder: AppointmentReminder,
  appointmentCount: number,
) => {
  if (
    appointmentReminder.appointmentCount &&
    appointmentReminder.appointmentCount.type !== "none" &&
    appointmentReminder.appointmentCount.count
  ) {
    switch (appointmentReminder.appointmentCount.type) {
      case "lessThan":
        return appointmentCount < appointmentReminder.appointmentCount.count;
      case "equalTo":
        return appointmentCount === appointmentReminder.appointmentCount.count;
      case "greaterThan":
        return appointmentCount > appointmentReminder.appointmentCount.count;
      case "lessThanOrEqualTo":
        return appointmentCount <= appointmentReminder.appointmentCount.count;
      case "greaterThanOrEqualTo":
        return appointmentCount >= appointmentReminder.appointmentCount.count;
    }
  }

  return true;
};
