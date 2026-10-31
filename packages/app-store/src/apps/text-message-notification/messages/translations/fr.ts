import { TextMessageNotificationMessage } from "../types";

export const FrTextMessageNotificationMessages: TextMessageNotificationMessage =
  {
    newAppointmentRequested: `Bonjour {{user.name}},
{{customer.name}} a demandé un nouveau rendez-vous pour {{service.name}} {{#duration.hours}}{{.}}hr {{/duration.hours}}{{#duration.minutes}}{{.}}min{{/duration.minutes}} pour {{dateTime.full}}.{{#totalPriceFormatted}} Prix total {{.}}.{{/totalPriceFormatted}}{{#totalAmountPaidFormatted}} Montant payé {{.}}.{{/totalAmountPaidFormatted}}
Répondez{{#confirmed}} Y pour confirmer,{{/confirmed}} N pour refuser`,
    unknownAppointment: "Rendez-vous inconnu",
    unknownOption:
      "Option inconnue. Répondez{{#confirmed}} Y pour confirmer,{{/confirmed}} N pour refuser",
    appointmentConfirmed: `Bonjour {{user.name}},
Le rendez-vous {{customer.name}} pour {{service.name}} le {{dateTime.full}} a été confirmé.
Merci`,
    appointmentDeclined: `Bonjour {{user.name}},
Le rendez-vous {{customer.name}} pour {{service.name}} le {{dateTime.full}} a été refusé/annulé.
Merci`,
  };
