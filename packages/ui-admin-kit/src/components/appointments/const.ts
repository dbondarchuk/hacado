import { AppointmentStatus } from "@hacado/types";

export const APPOINTMENT_STATUS_STYLES: Record<AppointmentStatus, string> = {
  confirmed: "bg-primary/15 text-primary",
  pending: "bg-brand/15 text-brand",
  declined: "bg-red-50 text-red-500",
  canceled: "bg-orange-50 text-orange-600",
  noShow: "bg-muted text-muted-foreground",
};
