import { TemplatesTemplate } from "@hacado/types/templates";

export const waitlistSlotOpenedTextMessageTemplate: TemplatesTemplate = {
  name: "Waitlist slot opened text message",
  type: "text-message",
  value:
    "Hi {{waitlistEntry.name}}, {{#isMorning}}a morning{{/isMorning}}{{#isAfternoon}}an afternoon{{/isAfternoon}}{{#isEvening}}an evening{{/isEvening}} time opened for {{waitlistEntry.service.name}} with {{waitlistEntry.member.name}}{{#waitlistEntry.member.jobTitle}} ({{waitlistEntry.member.jobTitle}}){{/waitlistEntry.member.jobTitle}} on {{slotDateTime.full}}{{#hasOtherTimes}} (and other times too){{/hasOtherTimes}}.\n\n" +
    // "Book: {{bookingUrl}}\nLeave the waitlist: {{leaveWaitlistUrl}}\n\n" +
    "Reply {{smsRemoveKeyword}} to leave this waitlist request.",
};
