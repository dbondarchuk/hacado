import { EmailTemplate } from "../types";

export const TeamInvitationTemplate: EmailTemplate["teamInvitation"] = {
  subject: "Has sido invitado a unirte a {{organizationName}}",
  body: {
    previewText: "Únase a {{organizationName}} en Hacado",
    content: [
      {
        type: "title",
        text: "invitación de equipo",
      },
      {
        type: "text",
        text: `Hola,

**{{inviterName}}** te invitó a unirte a **{{organizationName}}**.

Haga clic en el botón de abajo para aceptar la invitación.`,
      },
      {
        type: "button",
        button: {
          text: "Aceptar invitación",
          url: "{{url}}",
        },
      },
      {
        type: "text",
        text: `> **¿El botón no funciona?**

> <span style="font-size: 12px;">Copia y pega el siguiente enlace en tu navegador:</span>

> <span style="font-size: 12px;">{{url}}</span>
---

<span style="font-size: 12px;">Esta invitación vence en 2 días. Si no esperaba este correo electrónico, puede ignorarlo.</span>`,
      },
    ],
  },
};
