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
  allowPhoneOtp: boolean;
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
  await fetchClientApi("/customer-auth/logout", {
    method: "POST",
    credentials: "include",
  });
};
