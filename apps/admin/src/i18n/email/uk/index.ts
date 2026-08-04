import { EmailTemplate } from "../types";
import { ChangeEmailTemplate } from "./change-email";
import { EmailVerificationTemplate } from "./email-verification";
import { MembersReactivatedTemplate } from "./members-reactivated";
import { ResetPasswordTemplate } from "./reset-password";
import { TeamInvitationTemplate } from "./team-invitation";

export const ukEmailTemplates: EmailTemplate = {
  emailVerification: EmailVerificationTemplate,
  resetPassword: ResetPasswordTemplate,
  changeEmail: ChangeEmailTemplate,
  teamInvitation: TeamInvitationTemplate,
  membersReactivated: MembersReactivatedTemplate,
};
