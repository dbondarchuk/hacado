import { EmailTemplates } from "../types";

const getText = (customText: string) => `
Hi {{user.name}},

${customText}

Requested on {{ waitlistEntry.createdAt.full }}

Customer: [{{ customer.name }}]({{ adminUrl }}/dashboard/customers/{{customer._id}})

Name: {{ waitlistEntry.name }}

Email: {{ waitlistEntry.email }}

Phone: {{ waitlistEntry.phone }}

Option selected: {{ waitlistEntry.option.name }}

Specialist: {{ member.name }}

Addons selected:

{{#waitlistEntry.addons}}
1. {{name}}
{{/waitlistEntry.addons}}
{{^waitlistEntry.addons}}
- None
{{/waitlistEntry.addons}}

{{#waitlistEntry.note}}
Note: {{.}}
{{/waitlistEntry.note}}

{{#waitlistEntry.asSoonAsPossible}}
Time: As soon as possible
{{/waitlistEntry.asSoonAsPossible}}
{{^waitlistEntry.asSoonAsPossible}}
Times:

{{#waitlistEntry.dates}}
- {{date.dateHuge}}:{{#isMorning}} Morning (before 12:00PM){{/isMorning}}{{#isAfternoon}} Afternoon (12:00PM - 4:00PM){{/isAfternoon}}{{#isEvening}} Evening (after 4:00PM){{/isEvening}}
{{/waitlistEntry.dates}}
{{/waitlistEntry.asSoonAsPossible}}

{{#waitlistEntry.duration}}
Duration: {{#hours}}{{.}} hr {{/hours}}{{#minutes}}{{.}} min{{/minutes}}
{{/waitlistEntry.duration}}
`;

export const EnEmailTemplates: EmailTemplates = {
  newWaitlistEntry: {
    title:
      "New waitlist entry by {{waitlistEntry.name}} for {{waitlistEntry.option.name}}",
    text: getText(
      "New waitlist entry by {{waitlistEntry.name}} for {{waitlistEntry.option.name}}",
    ),
  },
  subject:
    "New waitlist entry by {{waitlistEntry.name}} for {{waitlistEntry.option.name}}",
  buttonTexts: {
    viewWaitlist: "View Wait List",
    createAppointment: "Create Appointment",
    dismiss: "Dismiss",
  },
};
