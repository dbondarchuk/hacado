import { EmailTemplate } from "../types";

export const ResetPasswordTemplate: EmailTemplate["resetPassword"] = {
  subject: "Reset your password",
  body: {
    previewText: "Reset your password",
    content: [
      {
        type: "title",
        text: "Reset your password",
      },
      {
        type: "text",
        text: `Hi **{{name}}**,

Please reset your password by clicking the button below. This helps us confirm that you own this email and keeps your account secure.
`,
      },
      {
        type: "button",
        button: {
          text: "Reset My Password",
          url: "{{url}}",
        },
      },
      {
        type: "text",
        text: `> **Button not working?** 

> <span style="font-size: 12px;">Copy and paste the link below into your browser:</span>

> <span style="font-size: 12px;">{{url}}</span>
---

#### Important Notes

- <span style="font-size: 12px;">This reset password link **expires in 24 hours**</span>
- <span style="font-size: 12px;">If you **did not** request a password reset, please ignore this email - no action is required</span>
- <span style="font-size: 12px;">**Never share** this link with anyone for your account's security</span>
---`,
      },
    ],
  },
};
