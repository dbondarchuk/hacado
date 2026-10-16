import { EmailTemplate } from "../types";

export const ResetPasswordTemplate: EmailTemplate["resetPassword"] = {
  subject: "Restablece tu contraseña",
  body: {
    previewText: "Restablece tu contraseña",
    content: [
      {
        type: "title",
        text: "Restablece tu contraseña",
      },
      {
        type: "text",
        text: `Hola **{{name}}**,

Restablezca su contraseña haciendo clic en el botón a continuación. Esto nos ayuda a confirmar que usted es el propietario de este correo electrónico y mantiene su cuenta segura.`,
      },
      {
        type: "button",
        button: {
          text: "Restablecer mi contraseña",
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

- <span style="font-size: 12px;">Este enlace para restablecer la contraseña **caduca en 24 horas**</span>
- <span style="font-size: 12px;">Si **no** solicitó un restablecimiento de contraseña, ignore este correo electrónico; no se requiere ninguna acción</span>
- <span style="font-size: 12px;">**Nunca compartas** este enlace con nadie por la seguridad de tu cuenta</span>
---`,
      },
    ],
  },
};
