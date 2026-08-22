export type RequestOtpResult = {
  success: true;
  otpExpiresAt: number;
  resendAfter: number;
};

export type VerifyOtpResult = {
  success: true;
  name?: string;
  email?: string;
  phone?: string;
  id?: string;
  token: string;
};

export type RequestOtpPayload = {
  email?: string;
  phone?: string;
};

export type VerifyOtpPayload = {
  email?: string;
  phone?: string;
  otp: string;
  ip: string;
};

export type CustomerAuthOptions = {
  otpChannels: import("../configuration/customer-auth").CustomerOtpChannels;
};
