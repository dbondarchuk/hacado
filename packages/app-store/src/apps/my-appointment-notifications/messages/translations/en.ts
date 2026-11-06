import { MyAppointmentNotificationsMessage } from "../types";

export const EnMyAppointmentNotificationsMessages: MyAppointmentNotificationsMessage =
  {
    pending: `Hi {{user.name}},
{{customer.name}} has requested a new appointment for {{service.name}} {{#duration.hours}}{{.}}hr {{/duration.hours}}{{#duration.minutes}}{{.}}min{{/duration.minutes}} for {{dateTime.full}}.{{#totalPriceFormatted}} Total price {{.}}.{{/totalPriceFormatted}}{{#totalAmountPaidFormatted}} Amount paid {{.}}.{{/totalAmountPaidFormatted}}
Respond{{#confirmed}} Y to confirm,{{/confirmed}} N to decline`,
    confirmed: `Hi {{user.name}},
Appointment {{customer.name}} for {{service.name}} on {{dateTime.full}} is confirmed.
Thank you`,
    declined: `Hi {{user.name}},
Appointment {{customer.name}} for {{service.name}} on {{dateTime.full}} was declined.
Thank you`,
    canceled: `Hi {{user.name}},
Appointment {{customer.name}} for {{service.name}} on {{dateTime.full}} was canceled.
Thank you`,
    noShow: `Hi {{user.name}},
{{customer.name}} was marked as a no-show for {{service.name}} on {{dateTime.full}}.
Thank you`,
    rescheduled: `Hi {{user.name}},
Appointment {{customer.name}} for {{service.name}} was rescheduled to {{dateTime.full}}.
Thank you`,
    unknownAppointment: "Unknown appointment",
    unknownOption:
      "Unknown option. Respond{{#confirmed}} Y to confirm,{{/confirmed}} N to decline",
    appointmentConfirmed: `Hi {{user.name}},
Appointment {{customer.name}} for {{service.name}} on {{dateTime.full}} was confirmed.
Thank you`,
    appointmentDeclined: `Hi {{user.name}},
Appointment {{customer.name}} for {{service.name}} on {{dateTime.full}} was declined/cancelled.
Thank you`,
  };
