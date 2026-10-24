import type {
  SmsMessagingAccess,
  TextMessagingConfig,
} from "../text-message/registration";

export interface ITextMessageConfigurationService {
  isEnabled(): Promise<boolean>;
  getPublicConfig(websiteUrl: string): Promise<TextMessagingConfig>;
  getSmsMessagingAccess(): Promise<SmsMessagingAccess>;
}
