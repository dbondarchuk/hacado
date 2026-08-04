import { UserEmailTemplateProps } from "@timelish/email-builder/static";

export type EmailTemplate = {
  changeEmail: {
    subject: string;
    body: UserEmailTemplateProps;
  };
  resetPassword: {
    subject: string;
    body: UserEmailTemplateProps;
  };
  emailVerification: {
    subject: string;
    body: UserEmailTemplateProps;
  };
  teamInvitation: {
    subject: string;
    body: UserEmailTemplateProps;
  };
  membersReactivated: {
    subject: string;
    body: UserEmailTemplateProps;
  };
};
