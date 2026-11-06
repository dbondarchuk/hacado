import { MyAppointmentNotificationsMessage } from "../types";

export const EsMyAppointmentNotificationsMessages: MyAppointmentNotificationsMessage =
  {
    pending: `Hola {{user.name}},
{{customer.name}} ha solicitado una nueva cita para {{service.name}} {{#duration.hours}}{{.}}hr {{/duration.hours}}{{#duration.minutes}}{{.}}min{{/duration.minutes}} para {{dateTime.full}}.{{#totalPriceFormatted}} Precio total {{.}}.{{/totalPriceFormatted}}{{#totalAmountPaidFormatted}} Importe pagado {{.}}.{{/totalAmountPaidFormatted}}
Responda{{#confirmed}} Y para confirmar,{{/confirmed}} N para rechazar`,
    confirmed: `Hola {{user.name}},
La cita {{customer.name}} para {{service.name}} el {{dateTime.full}} está confirmada.
Gracias`,
    declined: `Hola {{user.name}},
La cita {{customer.name}} para {{service.name}} el {{dateTime.full}} fue rechazada.
Gracias`,
    canceled: `Hola {{user.name}},
La cita {{customer.name}} para {{service.name}} el {{dateTime.full}} fue cancelada.
Gracias`,
    noShow: `Hola {{user.name}},
{{customer.name}} no se presentó a {{service.name}} el {{dateTime.full}}.
Gracias`,
    rescheduled: `Hola {{user.name}},
La cita {{customer.name}} para {{service.name}} fue reprogramada para el {{dateTime.full}}.
Gracias`,
    unknownAppointment: "Cita desconocida",
    unknownOption:
      "Opción desconocida. Responda{{#confirmed}} Y para confirmar,{{/confirmed}} N para rechazar",
    appointmentConfirmed: `Hola {{user.name}},
Se confirmó la cita {{customer.name}} para {{service.name}} el {{dateTime.full}}.
Gracias`,
    appointmentDeclined: `Hola {{user.name}},
La cita {{customer.name}} para {{service.name}} el {{dateTime.full}} fue rechazada/cancelada.
Gracias`,
  };
