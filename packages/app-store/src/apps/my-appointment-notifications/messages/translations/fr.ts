import { MyAppointmentNotificationsMessage } from "../types";

export const FrMyAppointmentNotificationsMessages: MyAppointmentNotificationsMessage =
  {
    pending: `Bonjour {{user.name}},
{{customer.name}} a demandé un nouveau rendez-vous pour {{service.name}} {{#duration.hours}}{{.}}hr {{/duration.hours}}{{#duration.minutes}}{{.}}min{{/duration.minutes}} pour {{dateTime.full}}.{{#totalPriceFormatted}} Prix total {{.}}.{{/totalPriceFormatted}}{{#totalAmountPaidFormatted}} Montant payé {{.}}.{{/totalAmountPaidFormatted}}
Répondez{{#confirmed}} Y pour confirmer,{{/confirmed}} N pour refuser`,
    confirmed: `Bonjour {{user.name}},
Le rendez-vous {{customer.name}} pour {{service.name}} le {{dateTime.full}} est confirmé.
Merci`,
    declined: `Bonjour {{user.name}},
Le rendez-vous {{customer.name}} pour {{service.name}} le {{dateTime.full}} a été refusé.
Merci`,
    canceled: `Bonjour {{user.name}},
Le rendez-vous {{customer.name}} pour {{service.name}} le {{dateTime.full}} a été annulé.
Merci`,
    noShow: `Bonjour {{user.name}},
{{customer.name}} ne s'est pas présenté pour {{service.name}} le {{dateTime.full}}.
Merci`,
    rescheduled: `Bonjour {{user.name}},
Le rendez-vous {{customer.name}} pour {{service.name}} a été reporté au {{dateTime.full}}.
Merci`,
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
