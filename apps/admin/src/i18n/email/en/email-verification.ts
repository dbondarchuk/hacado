import { EmailTemplate } from "../types";

export const EmailVerificationTemplate: EmailTemplate["emailVerification"] = {
  subject: "Verify your email address",
  body: {
    previewText: "Verify your email address",
    content: [
      {
        type: "title",
        text: "Verify your email address",
      },
      {
        type: "text",
        text: `Hi **{{name}}**,

Please verify your email address by clicking the button below. This helps us confirm that you own this email and keeps your account secure.
`,
      },
      {
        type: "button",
        button: {
          text: "Verify My Email Address",
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

- <span style="font-size: 12px;">This verification link **expires in 24 hours**</span>
- <span style="font-size: 12px;">If you **did not** create an account, please ignore this email - no action is required</span>
- <span style="font-size: 12px;">**Never share** this link with anyone for your account's security</span>
---`,
      },
    ],
  },
};
