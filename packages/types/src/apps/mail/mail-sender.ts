import { CommunicationParticipantType } from "../../communication/communication";
import { ConnectedAppData } from "../connected-app.data";
import { EventAttributes } from "./event-attributes";

export type IcalEventMethod = "PUBLISH" | "REQUEST" | "CANCEL" | "REPLY";

export type EmailAttachment = {
  filename: string;
  contentType: string;
  storageFilename: string;
  cid: string;
};

export type Email = {
  to: string | string[];
  cc?: string | string[];
  subject: string;
  body: string;
  icalEvent?: {
    method: IcalEventMethod;
    filename?: string;
    content: EventAttributes;
  };
  attachments?: EmailAttachment[];
};

export type EmailResponse = {
  messageId: string;
};

export interface IMailSenderApp {
  sendMail: (app: ConnectedAppData, mail: Email) => Promise<EmailResponse>;
}

export interface IMailSender {
  sendMail: (
    mail: Email,
    target: CommunicationParticipantType,
    fromName?: string,
  ) => Promise<EmailResponse>;
}
