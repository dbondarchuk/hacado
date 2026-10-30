import {
  addonsSelectedBlock,
  buildCustomerEmailTemplate,
  businessFooterBlock,
} from "@hacado/email-builder/static";
import { TemplatesTemplate } from "@hacado/types/templates";

export const waitlistEntryCreatedEmailTemplate: TemplatesTemplate =
  buildCustomerEmailTemplate({
    id: "waitlist-entry-created-email",
    name: "Nuevo correo electrónico de entrada a la lista de espera",
    subject: "¡Gracias por unirte a la lista de espera!",
    content: [
      {
        type: "title",
        text: "¡Gracias por unirte a la lista de espera!",
      },
      {
        type: "text",
        text: `Hola {{waitlistEntry.name}},

¡Gracias por seleccionar {{config.name}}!

Hemos recibido su solicitud para unirse a nuestra lista de espera.

Nos pondremos en contacto con usted tan pronto como se abra un horario para la fecha deseada.

Servicio solicitado: {{waitlistEntry.service.name}}

Especialista: {{waitlistEntry.member.name}}{{#waitlistEntry.member.jobTitle}} ({{waitlistEntry.member.jobTitle}}){{/waitlistEntry.member.jobTitle}}`,
      },
      addonsSelectedBlock(
        "Complementos seleccionados: {{#addons}}{{name}}, {{/addons}}",
      ),
      {
        type: "text",
        text: `¡Estamos deseando verte!

Saludos cordiales,

{{config.name}}`,
      },
      businessFooterBlock,
    ],
  });
