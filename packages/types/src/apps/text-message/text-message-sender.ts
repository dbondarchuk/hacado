import { ConnectedAppData } from "../connected-app.data";

export type TextMessageData = {
  appId?: string;
  appointmentId?: string;
  customerId?: string;
  data?: string;
};

export type TextMessage = {
  phone: string;
  message: string;
  memberId?: string;
  data?: TextMessageData;
  sender?: string;
};

export type TextMessageResponse = {
  success: boolean;
  error?: string;
  textId?: string;
  data?: any;
};

export interface ITextMessageSenderApp {
  sendTextMessage: (
    app: ConnectedAppData,
    message: TextMessage,
  ) => Promise<TextMessageResponse>;
}

export interface ITextMessageSender {
  sendTextMessage: (
    organizationId: string,
    message: TextMessage,
  ) => Promise<TextMessageResponse>;
}
