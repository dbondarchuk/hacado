import { EmailTemplate } from "../types";

export const EmailOtpChangeEmailTemplate: EmailTemplate["emailOtpChangeEmail"] =
  {
    subject: "Your email change code",
    body: {
      previewText: "Your email change code",
      content: [
        {
          type: "title",
          text: "Confirm email change",
        },
        {
          type: "text",
          text: `Hi **{{name}}**,

Your email change verification code is:`,
        },
        {
          type: "title",
          text: "{{otp}}",
        },
        {
          type: "text",
          text: `This code expires in 5 minutes. Do not share it with anyone.

If you did not request an email change, you can ignore this email.`,
        },
      ],
    },
  };
