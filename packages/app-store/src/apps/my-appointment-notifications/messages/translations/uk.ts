import { MyAppointmentNotificationsMessage } from "../types";

export const UkMyAppointmentNotificationsMessages: MyAppointmentNotificationsMessage =
  {
    pending: `Привіт {{user.name}},
{{customer.name}} запитав новий запис для {{service.name}} {{#duration.hours}}{{.}}год {{/duration.hours}}{{#duration.minutes}}{{.}}хв{{/duration.minutes}} на {{dateTime.full}}.{{#totalPriceFormatted}} Загальна ціна {{.}}.{{/totalPriceFormatted}}{{#totalAmountPaidFormatted}} Сплачено {{.}}.{{/totalAmountPaidFormatted}}
Відповідайте{{#confirmed}} Y для підтвердження,{{/confirmed}} N для відхилення`,
    confirmed: `Привіт {{user.name}},
Запис {{customer.name}} для {{service.name}} на {{dateTime.full}} підтверджено.
Дякуємо`,
    declined: `Привіт {{user.name}},
Запис {{customer.name}} для {{service.name}} на {{dateTime.full}} відхилено.
Дякуємо`,
    canceled: `Привіт {{user.name}},
Запис {{customer.name}} для {{service.name}} на {{dateTime.full}} скасовано.
Дякуємо`,
    noShow: `Привіт {{user.name}},
{{customer.name}} не з'явився на {{service.name}} {{dateTime.full}}.
Дякуємо`,
    rescheduled: `Привіт {{user.name}},
Запис {{customer.name}} для {{service.name}} перенесено на {{dateTime.full}}.
Дякуємо`,
    unknownAppointment: "Невідомий запис",
    unknownOption:
      "Невідома опція. Відповідайте{{#confirmed}} Y для підтвердження,{{/confirmed}} N для відхилення",
    appointmentConfirmed: `Привіт {{user.name}},
Запис {{customer.name}} для {{service.name}} на {{dateTime.full}} був підтверджений.
Дякуємо`,
    appointmentDeclined: `Привіт {{user.name}},
Запис {{customer.name}} для {{service.name}} на {{dateTime.full}} був відхилений/скасований.
Дякуємо`,
  };
