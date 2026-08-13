import { EmailTemplate } from "../types";

export const TeamInvitationTemplate: EmailTemplate["teamInvitation"] = {
  subject: "You've been invited to join {{organizationName}}",
  body: {
    previewText: "Join {{organizationName}} on Hacado",
    content: [
      {
        type: "title",
        text: "Team invitation",
      },
      {
        type: "text",
        text: `Hi,

**{{inviterName}}** invited you to join **{{organizationName}}**.

Click the button below to accept the invitation.
`,
      },
      {
        type: "button",
        button: {
          text: "Accept invitation",
          url: "{{url}}",
        },
      },
      {
        type: "text",
        text: `> **Button not working?**

> <span style="font-size: 12px;">Copy and paste the link below into your browser:</span>

> <span style="font-size: 12px;">{{url}}</span>
---

<span style="font-size: 12px;">This invitation expires in 2 days. If you were not expecting this email, you can ignore it.</span>`,
      },
    ],
  },
};
