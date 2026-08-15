import { IAssetsStorage, IMailSender } from "@hacado/types";
import { ResendService } from "./resend";
import { getResendConfiguration } from "./resend/utils";
import { SmtpService } from "./smtp";
import { getSmtpConfiguration } from "./smtp/utils";

export type EmailProvider = "smtp" | "resend";

export const getEmailProvider = (): EmailProvider => {
  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (provider === "resend") {
    return "resend";
  }
  return "smtp";
};

export const createDefaultEmailService = (
  storageService: IAssetsStorage,
): IMailSender => {
  const provider = getEmailProvider();
  if (provider === "resend") {
    return new ResendService(getResendConfiguration(), storageService);
  }

  return new SmtpService(getSmtpConfiguration(), storageService);
};
