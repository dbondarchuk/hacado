"use client";

import {
  Appointment,
  AppointmentStatus,
  isClosedAppointmentStatus,
} from "@hacado/types/booking";
import { AppointmentDeclineDialog } from "@hacado/ui-admin-kit";
import { useReload } from "@hacado/ui-admin/hooks";

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
