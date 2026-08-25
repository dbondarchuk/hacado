import { EmailTemplate } from "../types";

export const EmailOtpPasswordResetTemplate: EmailTemplate["emailOtpPasswordReset"] =
  {
    subject: "Your password reset code",
    body: {
      previewText: "Your password reset code",
      content: [
        {
          type: "title",
          text: "Reset your password",
        },
        {
          type: "text",
          text: `Hi **{{name}}**,

Your password reset code is:`,
        },
        {
          type: "title",
          text: "{{otp}}",
        },
        {
          type: "text",
          text: `This code expires in 5 minutes. Do not share it with anyone.

If you did not request a password reset, you can ignore this email.`,
        },
      ],
    },
  };
