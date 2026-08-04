import { EmailTemplate } from "../types";

export const MembersReactivatedTemplate: EmailTemplate["membersReactivated"] = {
  subject: "Team members restored for {{organizationName}}",
  body: {
    previewText: "Seat upgrade restored members on your team",
    content: [
      {
        type: "title",
        text: "Team members restored",
      },
      {
        type: "text",
        text: `Hi **{{name}}**,

Your available user slots increased. The following members were automatically reactivated:

{{memberNames}}

You have **{{remainingSlots}}** seat(s) remaining.
`,
      },
    ],
  },
};
