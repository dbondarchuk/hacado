import { SmtpConfiguration } from "./types";

export const getSmtpConfiguration = (): SmtpConfiguration => {
  return {
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT!),
    secure: process.env.SMTP_SECURE === "true",
    email: process.env.SMTP_EMAIL!,
    fromName: process.env.SMTP_FROM_NAME || "Hacado",
    auth: {
      user: process.env.SMTP_AUTH_USER,
      pass: process.env.SMTP_AUTH_PASS,
    },
  };
};
