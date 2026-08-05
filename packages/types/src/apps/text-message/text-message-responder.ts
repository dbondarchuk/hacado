import { AllKeys, I18nNamespaces } from "@hacado/i18n";
import { Appointment } from "../../booking";
import { CommunicationParticipantType } from "../../communication";
import { Customer } from "../../customers";
import { ConnectedAppData } from "../connected-app.data";
import { TextMessageData } from "./text-message-sender";

export type TextMessageReply = {
  from: string;
  message: string;
  data: TextMessageData;
  appointment: Appointment | null;
  customer: Customer | null;
  memberId?: string;
  messageId?: string;
};

export type RespondResult<
  T extends I18nNamespaces = I18nNamespaces,
  CustomKeys extends string | undefined = undefined,
> = {
  handledBy: AllKeys<T, CustomKeys>;
  participantType: CommunicationParticipantType;
};

export interface ITextMessageResponder {
  respond(
    appData: ConnectedAppData,
    reply: TextMessageReply,
  ): Promise<RespondResult | null>;
}
