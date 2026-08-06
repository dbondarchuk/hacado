import { Appointment } from "@hacado/types";
import React from "react";

export const AppointmentViewContext = React.createContext<{
  appointment: Appointment;
  setAppointment: React.Dispatch<React.SetStateAction<Appointment>>;
  key: string;
  setKey: (key: string) => void;
}>({
  appointment: null as unknown as Appointment,
  setAppointment: () => {},
  key: "",
  setKey: () => {},
});
