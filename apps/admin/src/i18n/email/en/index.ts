import { EmailTemplate } from "../types";
import { ChangeEmailTemplate } from "./change-email";
import { EmailOtpChangeEmailTemplate } from "./email-otp-change-email";
import { EmailOtpPasswordResetTemplate } from "./email-otp-password-reset";
import { EmailOtpVerificationTemplate } from "./email-otp-verification";
import { EmailVerificationTemplate } from "./email-verification";
import { MembersReactivatedTemplate } from "./members-reactivated";
import { ResetPasswordTemplate } from "./reset-password";
import { TeamInvitationTemplate } from "./team-invitation";

export const enEmailTemplates: EmailTemplate = {
  emailVerification: EmailVerificationTemplate,
  emailOtpVerification: EmailOtpVerificationTemplate,
  emailOtpPasswordReset: EmailOtpPasswordResetTemplate,
  emailOtpChangeEmail: EmailOtpChangeEmailTemplate,
  resetPassword: ResetPasswordTemplate,
  changeEmail: ChangeEmailTemplate,
  teamInvitation: TeamInvitationTemplate,
  membersReactivated: MembersReactivatedTemplate,
};
