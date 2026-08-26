import type {
  CustomerOtpChannels,
  CustomerPackage,
  CustomerPackageListModel,
  WithTotal,
} from "@hacado/types";
import { fetchClientApi } from "./utils";

export type RequestOtpResponse = {
  success: true;
  otpExpiresAt: number;
  resendAfter: number;
};

export type VerifyOtpResponse = {
  success: true;
  name?: string;
  email?: string;
  phone?: string;
  id?: string;
};

export type AuthOptionsResponse = {
  success: true;
  otpChannels: CustomerOtpChannels;
};

export type CheckSessionResponse = {
  success: true;
  name?: string;
  email?: string;
  phone?: string;
  id?: string;
};

export const getAuthOptions = async () => {
  const response = await fetchClientApi("/customer-auth/options", {
    method: "GET",
    credentials: "include",
  });
  return response.json<AuthOptionsResponse>();
};

export const requestOtp = async (payload: {
  email?: string;
  phone?: string;
}) => {
  const response = await fetchClientApi("/customer-auth/request-otp", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return response.json<RequestOtpResponse>();
};

export const verifyOtp = async (payload: {
  email?: string;
  phone?: string;
  otp: string;
}) => {
  const response = await fetchClientApi("/customer-auth/verify-otp", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return response.json<VerifyOtpResponse>();
};

export const checkSession = async () => {
  const response = await fetchClientApi("/customer-auth/check", {
    method: "GET",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("unauthorized");
  }
  return response.json<CheckSessionResponse>();
};

export const logout = async () => {
  const response = await fetchClientApi("/customer-auth/logout", {
    method: "POST",
    credentials: "include",
  });
  return response.json<{ success: true }>();
};

const normalizeEmail = (value?: string) => (value ?? "").trim().toLowerCase();
const normalizePhone = (value?: string) => (value ?? "").replace(/[^\d+]/g, "");

export const sessionMatchesBookingFields = async (fields: {
  email?: string;
  phone?: string;
}) => {
  const email = normalizeEmail(fields.email);
  const phone = normalizePhone(fields.phone);
  if (!email || !phone) return false;

  try {
    const session = await checkSession();
    return (
      normalizeEmail(session.email) === email &&
      normalizePhone(session.phone) === phone
    );
  } catch {
    return false;
  }
};

export const requestBookingOtp = async (payload: {
  name?: string;
  email?: string;
  phone?: string;
  channel?: "email" | "phone";
  /** When true, never create/update a customer - OTP only if they already exist. */
  existingOnly?: boolean;
}) => {
  const response = await fetchClientApi("/booking/request-otp", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return response.json<RequestOtpResponse>();
};

export const getMyPackages = async () => {
  const response = await fetchClientApi("/booking/packages", {
    method: "GET",
    credentials: "include",
  });
  return response.json<WithTotal<CustomerPackageListModel>>();
};

export const getEligiblePackages = async (params: {
  optionId: string;
  memberId: string;
  dateTime?: string;
}) => {
  const search = new URLSearchParams(params);
  const response = await fetchClientApi(
    `/booking/packages/eligible?${search.toString()}`,
    { method: "GET", credentials: "include" },
  );

  return response.json<{ items: CustomerPackage[] }>();
};
