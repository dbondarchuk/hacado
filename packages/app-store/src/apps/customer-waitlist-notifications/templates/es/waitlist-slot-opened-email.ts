import {
  EMAIL_BRAND,
  addonsSelectedBlock,
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types";

export const waitlistSlotOpenedEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "waitlist-slot-opened-email",
    name: "Correo electrónico con espacio en lista de espera abierto",
    subject: "Un tiempo abierto para {{waitlistEntry.option.name}}",
    content: [
      {
        type: "title",
        text: "Se acaba de abrir un horario",
      },
      {
        type: "text",
        text: `Hola {{waitlistEntry.name}},

Hay disponible un horario que coincide con su solicitud de lista de espera{{#isMorning}} por la mañana{{/isMorning}}{{#isAfternoon}} por la tarde{{/isAfternoon}}{{#isEvening}} por la noche{{/isEvening}}:

Servicio: {{waitlistEntry.option.name}}
Especialista: {{waitlistEntry.member.name}}{{#waitlistEntry.member.jobTitle}} ({{waitlistEntry.member.jobTitle}}){{/waitlistEntry.member.jobTitle}}
Cuándo: {{slotDateTime.full}}{{#hasOtherTimes}} (y otras veces también){{/hasOtherTimes}}

Reserva ahora para reclamar este tiempo. Si ya no lo necesitas, puedes abandonar la lista de espera.`,
      },
      addonsSelectedBlock(
        "Complementos seleccionados: {{#addons}}{{name}}, {{/addons}}",
      ),
      {
        type: "button",
        button: {
          text: "Reserva esta vez",
          url: "{{bookingUrl}}",
        },
      },
      {
        type: "button",
        button: {
          text: "Dejar lista de espera",
          url: "{{leaveWaitlistUrl}}",
          backgroundColor: EMAIL_BRAND.destructive,
        },
      },
      {
        type: "text",
        text: `Saludos cordiales,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
