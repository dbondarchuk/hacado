import { TextMessageNotificationMessage } from "../types";

export const EsTextMessageNotificationMessages: TextMessageNotificationMessage =
  {
    newAppointmentRequested: `Hola {{user.name}},
{{customer.name}} ha solicitado una nueva cita para {{option.name}} {{#duration.hours}}{{.}}hr {{/duration.hours}}{{#duration.minutes}}{{.}}min{{/duration.minutes}} para {{dateTime.full}}.{{#totalPriceFormatted}} Precio total {{.}}.{{/totalPriceFormatted}}{{#totalAmountPaidFormatted}} Importe pagado {{.}}.{{/totalAmountPaidFormatted}}
Responda{{#confirmed}} Y para confirmar,{{/confirmed}} N para rechazar`,
    unknownAppointment: "Cita desconocida",
    unknownOption:
      "Opción desconocida. Responda{{#confirmed}} Y para confirmar,{{/confirmed}} N para rechazar",
    appointmentConfirmed: `Hola {{user.name}},
Se confirmó la cita {{customer.name}} para {{option.name}} el {{dateTime.full}}.
Gracias`,
    appointmentDeclined: `Hola {{user.name}},
La cita {{customer.name}} para {{option.name}} el {{dateTime.full}} fue rechazada/cancelada.
Gracias`,
  };
