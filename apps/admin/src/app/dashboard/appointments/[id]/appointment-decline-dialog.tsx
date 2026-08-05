"use client";

import { Appointment, AppointmentStatus } from "@hacado/types";
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
      open={appointment.status !== "declined"}
      onClose={onClose}
      onSuccess={handleSuccess}
    />
  );
};
