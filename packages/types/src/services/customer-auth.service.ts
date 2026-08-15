import type {
  CustomerAuthOptions,
  CustomerSession,
  RequestOtpPayload,
  RequestOtpResult,
  VerifyOtpPayload,
  VerifyOtpResult,
} from "../customer-auth";

export type ICustomerAuthService = {
  getAuthOptions(): Promise<CustomerAuthOptions>;
  requestOtp(payload: RequestOtpPayload, ip: string): Promise<RequestOtpResult>;
  verifyOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResult>;
  authorizeSession(
    sessionToken?: string | null,
  ): Promise<CustomerSession | null>;
  logout(sessionToken?: string | null): Promise<void>;
  getSessionCookieHeader(token: string): string;
  getClearSessionCookieHeader(): string;
};
