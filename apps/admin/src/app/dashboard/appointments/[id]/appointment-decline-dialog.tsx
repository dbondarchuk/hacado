"use client";

import {
  Appointment,
  AppointmentStatus,
  isClosedAppointmentStatus,
} from "@hacado/types";
import { useReload } from "@hacado/ui-admin";
import { AppointmentDeclineDialog } from "@hacado/ui-admin-kit";

export const AppointmentDeclineDialogWrapper: React.FC<{
  appointment: Appointment;
}> = ({ appointment }) => {
  const { reload } = useReload();
  const onClose = () => {
    location.replace("?");
  };

  const handleSuccess = (status: AppointmentStatus) => {
    reload();
  };

  return (
    <AppointmentDeclineDialog
      appointment={appointment}
      open={!isClosedAppointmentStatus(appointment.status)}
      onClose={onClose}
      onSuccess={handleSuccess}
    />
  );
};
