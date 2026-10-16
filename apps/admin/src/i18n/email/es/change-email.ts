import { EmailTemplate } from "../types";

export const ChangeEmailTemplate: EmailTemplate["changeEmail"] = {
  subject: "Cambia tu dirección de correo electrónico",
  body: {
    previewText: "Cambia tu dirección de correo electrónico",
    content: [
      {
        type: "title",
        text: "Cambia tu dirección de correo electrónico",
      },
      {
        type: "text",
        text: `Hola **{{name}}**,

Ha solicitado cambiar su dirección de correo electrónico a **{{newEmail}}**. Haga clic en el botón a continuación para confirmar este cambio.`,
      },
      {
        type: "button",
        button: {
          text: "Confirmar cambio de correo electrónico",
          url: "{{url}}",
        },
      },
      {
        type: "text",
        text: `> **¿El botón no funciona?** 

> <span style="font-size: 12px;">Copia y pega el siguiente enlace en tu navegador:</span>

> <span style="font-size: 12px;">{{url}}</span>
---

#### Notas importantes

- <span style="font-size: 12px;">Este enlace de cambio de correo electrónico **caduca en 24 horas**</span>
- <span style="font-size: 12px;">Si **no** solicitó un cambio de correo electrónico, ignore este correo electrónico; no se requiere ninguna acción</span>
- <span style="font-size: 12px;">**Nunca compartas** este enlace con nadie por la seguridad de tu cuenta</span>
---`,
      },
    ],
  },
};
