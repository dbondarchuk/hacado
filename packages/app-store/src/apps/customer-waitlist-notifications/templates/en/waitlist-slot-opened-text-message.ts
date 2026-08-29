import { TemplatesTemplate } from "@hacado/types";

export const waitlistSlotOpenedTextMessageTemplate: TemplatesTemplate = {
  name: "Waitlist slot opened text message",
  type: "text-message",
  value:
    "Hi {{waitlistEntry.name}}, {{#isMorning}}a morning{{/isMorning}}{{#isAfternoon}}an afternoon{{/isAfternoon}}{{#isEvening}}an evening{{/isEvening}} time opened for {{waitlistEntry.option.name}} with {{waitlistEntry.member.name}} on {{slotDateTime.full}}{{#hasOtherTimes}} (and other times too){{/hasOtherTimes}}.\n\nBook: {{bookingUrl}}\nLeave the waitlist: {{leaveWaitlistUrl}}\n\nReply {{smsRemoveKeyword}} to leave this waitlist request.",
};
