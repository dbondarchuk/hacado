import { EmailTemplate } from "../types";

export const EmailVerificationTemplate: EmailTemplate["emailVerification"] = {
  subject: "Verifica tu dirección de correo electrónico",
  body: {
    previewText: "Verifica tu dirección de correo electrónico",
    content: [
      {
        type: "title",
        text: "Verifica tu dirección de correo electrónico",
      },
      {
        type: "text",
        text: `Hola **{{name}}**,

Verifique su dirección de correo electrónico haciendo clic en el botón a continuación. Esto nos ayuda a confirmar que usted es el propietario de este correo electrónico y mantiene su cuenta segura.`,
      },
      {
        type: "button",
        button: {
          text: "Verificar mi dirección de correo electrónico",
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

- <span style="font-size: 12px;">Este enlace de verificación **caduca en 24 horas**</span>
- <span style="font-size: 12px;">Si **no** creó una cuenta, ignore este correo electrónico; no se requiere ninguna acción</span>
- <span style="font-size: 12px;">**Nunca compartas** este enlace con nadie por la seguridad de tu cuenta</span>
---`,
      },
    ],
  },
};
