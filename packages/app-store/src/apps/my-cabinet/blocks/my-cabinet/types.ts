import type {
  Appointment,
  ModifyAppointmentInformation,
  ModifyAppointmentType,
} from "@hacado/types";

export type AppointmentResponse = {
  appointment: Appointment;
};

export type HashState =
  | { screen: "list" }
  | { screen: "modify"; action: ModifyAppointmentType; appointmentId: string }
  | { screen: "book"; customerPackageId?: string };

export type RequestOtpResponse = {
  success: boolean;
  otpExpiresAt?: number;
  resendAfter?: number;
};

export type CustomerProfile = {
  name?: string;
  email?: string;
  phone?: string;
};

export type VerifyOtpResponse = {
  success: boolean;
} & Partial<CustomerProfile>;

export type CheckSessionResponse = {
  valid: boolean;
} & Partial<CustomerProfile>;

export type GetAppointmentsResponse = {
  customer?: { name?: string };
  upcoming: Appointment[];
  past: Appointment[];
};

export type AppointmentSummaryResponse = {
  upcomingCount: number;
  pastCount: number;
};

export type AppointmentListResponse = {
  items: Appointment[];
  total: number;
  page?: number;
  limit?: number;
  hasNextPage?: boolean;
};

export type AuthOptionsResponse = {
  otpChannels: import("@hacado/types").CustomerOtpChannels;
};

export type ModifyInformation = ModifyAppointmentInformation;

export type CustomerMeResponse = CustomerProfile;
