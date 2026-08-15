import { ResendConfiguration } from "./types";

export const getResendConfiguration = (): ResendConfiguration => {
  return {
    apiKey: process.env.RESEND_API_KEY!,
    email: process.env.RESEND_EMAIL!,
    fromName: process.env.RESEND_FROM_NAME || "Hacado",
    customerEmail: process.env.RESEND_CUSTOMER_EMAIL || undefined,
    customerFromName: process.env.RESEND_CUSTOMER_FROM_NAME || undefined,
  };
};
