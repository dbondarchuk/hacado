import { Language } from "@hacado/i18n";

export type TextMessageResenderMessage = {
  resendToUserFromCustomer: string;
  resendToUserFromUnknown: string;
};

export type TextMessageResenderMessages = Partial<
  Record<Language, TextMessageResenderMessage>
>;
