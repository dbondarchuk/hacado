import { EmailTemplate } from "../types";

export const ChangeEmailTemplate: EmailTemplate["changeEmail"] = {
  subject: "Change your email address",
  body: {
    previewText: "Change your email address",
    content: [
      {
        type: "title",
        text: "Change your email address",
      },
      {
        type: "text",
        text: `Hi **{{name}}**,

You have requested to change your email address to **{{newEmail}}**. Please click the button below to confirm this change.
`,
      },
      {
        type: "button",
        button: {
          text: "Confirm Email Change",
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

- <span style="font-size: 12px;">This email change link **expires in 24 hours**</span>
- <span style="font-size: 12px;">If you **did not** request an email change, please ignore this email - no action is required</span>
- <span style="font-size: 12px;">**Never share** this link with anyone for your account's security</span>
---`,
      },
    ],
  },
};
