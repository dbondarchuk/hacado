import { TextMessageNotificationMessage } from "../types";

export const EnTextMessageNotificationMessages: TextMessageNotificationMessage =
  {
    newAppointmentRequested: `Hi {{user.name}},
{{customer.name}} has requested a new appointment for {{option.name}} {{#duration.hours}}{{.}}hr {{/duration.hours}}{{#duration.minutes}}{{.}}min{{/duration.minutes}} for {{dateTime.full}}.{{#totalPriceFormatted}} Total price {{.}}.{{/totalPriceFormatted}}{{#totalAmountPaidFormatted}} Amount paid {{.}}.{{/totalAmountPaidFormatted}}
Respond{{#confirmed}} Y to confirm,{{/confirmed}} N to decline`,
    unknownAppointment: "Unknown appointment",
    unknownOption:
      "Unknown option. Respond{{#confirmed}} Y to confirm,{{/confirmed}} N to decline",
    appointmentConfirmed: `Hi {{user.name}},
Appointment {{customer.name}} for {{option.name}} on {{dateTime.full}} was confirmed.
Thank you`,
    appointmentDeclined: `Hi {{user.name}},
Appointment {{customer.name}} for {{option.name}} on {{dateTime.full}} was declined/cancelled.
Thank you`,
  };
