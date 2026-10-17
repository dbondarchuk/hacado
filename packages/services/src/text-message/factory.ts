import { ITextMessageSender } from "@hacado/types";
import { TelnyxService } from "./telnyx/service";

export const createDefaultTextMessageSender = (): ITextMessageSender => {
  return new TelnyxService();
};
