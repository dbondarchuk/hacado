import { EmailTemplates } from "../types";

const notifyFormResponseText = `Se envió una nueva respuesta para **{{form.name}}**.

Presentado el {{response.createdAtFormatted}}

{{#customer}}
Cliente: [{{name}}]({{ adminUrl }}/dashboard/customers/{{_id}})
{{/customer}}

{{#response.url}}
URL: [{{.}}]({{.}})
{{/response.url}}

{{#response.ip}}
IP: {{.}}
{{/response.ip}}

{{#response.userAgent}}
Navegador/version: {{.}}
{{/response.userAgent}}


**Respuestas:**

{{#response.answers}}
- **{{label}}:** {{valueFormatted}}
{{/response.answers}}`;

export const EsEmailTemplates: EmailTemplates = {
  "user-notify-form-response": {
    title: "Nueva respuesta del formulario",
    text: notifyFormResponseText,
    subject: "Nueva respuesta del formulario: {{form.name}}",
  },
  buttonTexts: {
    viewAllResponses: "Ver todas las respuestas",
    viewResponse: "Ver respuesta",
  },
  checkboxText: {
    yes: "Sí",
    no: "No",
  },
};
