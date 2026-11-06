import { Language } from "@hacado/i18n";

export type TextMessageForwardingMessage = {
  resendToUserFromCustomer: string;
  resendToUserFromUnknown: string;
};

export type TextMessageForwardingMessages = Partial<
  Record<Language, TextMessageForwardingMessage>
>;
