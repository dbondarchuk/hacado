export type EmailTemplate = {
  title: string;
  text: string;
  previewText?: string;
  subject: string;
};

export type EmailTemplateKey = "user-notify-reply";

export type EmailTemplates = {
  [key in EmailTemplateKey]: EmailTemplate;
} & {
  buttonTexts: Record<"viewAppointment" | "viewCustomer", string>;
};
