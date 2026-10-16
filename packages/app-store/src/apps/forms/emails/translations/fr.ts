import { EmailTemplates } from "../types";

const notifyFormResponseText = `Une nouvelle réponse a été soumise pour **{{form.name}}**.

Soumis le {{response.createdAtFormatted}}

{{#customer}}
Client : [{{name}}]({{ adminUrl }}/dashboard/customers/{{_id}})
{{/customer}}

{{#response.url}}
URL : [{{.}}]({{.}})
{{/response.url}}

{{#response.ip}}
Adresse IP : {{.}}
{{/response.ip}}

{{#response.userAgent}}
Navigateur/version : {{.}}
{{/response.userAgent}}


**Réponses :**

{{#response.answers}}
- **{{label}} :** {{valueFormatted}}
{{/response.answers}}`;

export const FrEmailTemplates: EmailTemplates = {
  "user-notify-form-response": {
    title: "Nouveau formulaire de réponse",
    text: notifyFormResponseText,
    subject: "Nouvelle réponse au formulaire : {{form.name}}",
  },
  buttonTexts: {
    viewAllResponses: "Afficher toutes les réponses",
    viewResponse: "Afficher la réponse",
  },
  checkboxText: {
    yes: "Oui",
    no: "Non",
  },
};
