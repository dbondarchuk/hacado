import { EmailTemplate } from "../types";

export const EmailOtpVerificationTemplate: EmailTemplate["emailOtpVerification"] =
  {
    subject: "Your verification code",
    body: {
      previewText: "Your verification code",
      content: [
        {
          type: "title",
          text: "Verify your email",
        },
        {
          type: "text",
          text: `Hi **{{name}}**,

Your verification code is:`,
        },
        {
          type: "title",
          text: "{{otp}}",
        },
        {
          type: "text",
          text: `This code expires in 5 minutes. Do not share it with anyone.

If you did not create an account, you can ignore this email.`,
        },
      ],
    },
  };
