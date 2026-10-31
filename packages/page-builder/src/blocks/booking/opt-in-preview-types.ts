import type { FieldType } from "@hacado/types/booking";

export type SmsOptInFormField = {
  name: string;
  type: FieldType;
  required?: boolean;
  data?: {
    label: string;
    description?: string;
    options?: { option: string }[];
    accept?: string[];
    maxSizeMb?: number;
  };
};

export type SmsOptInPreviewService = {
  _id: string;
  name: string;
};

export type SmsOptInPreviewProps = {
  service: SmsOptInPreviewService | null;
  formFields: SmsOptInFormField[];
};
