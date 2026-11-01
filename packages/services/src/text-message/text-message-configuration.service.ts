import type {
  IConfigurationService,
  IPagesService,
  ITextMessageConfigurationService,
} from "@hacado/types/services";
import type { TextMessagingConfig } from "@hacado/types/text-message/registration";
import { publishedPageUrl } from "@hacado/utils/website";
import { BaseService } from "../services/base.service";
import { readSmsMessagingAccess } from "./messaging-access";

export class TextMessageConfigurationService
  extends BaseService
  implements ITextMessageConfigurationService
{
  constructor(
    organizationId: string,
    private readonly configurationService: IConfigurationService,
    private readonly pagesService: IPagesService,
  ) {
    super("TextMessageConfigurationService", organizationId);
  }

  public async isEnabled(): Promise<boolean> {
    const textMessaging =
      await this.configurationService.getConfiguration("textMessaging");

    return textMessaging?.enabled === true;
  }

  public async getPublicConfig(
    websiteUrl: string,
  ): Promise<TextMessagingConfig> {
    const textMessaging =
      await this.configurationService.getConfiguration("textMessaging");

    if (!textMessaging?.enabled) return { enabled: false };

    const [privacyPage, termsPage] = await Promise.all([
      textMessaging.privacyPageId
        ? this.pagesService.getPage(textMessaging.privacyPageId)
        : null,
      textMessaging.termsPageId
        ? this.pagesService.getPage(textMessaging.termsPageId)
        : null,
    ]);

    return {
      enabled: true,
      privacyUrl: publishedPageUrl(websiteUrl, privacyPage),
      termsUrl: publishedPageUrl(websiteUrl, termsPage),
    };
  }

  public getSmsMessagingAccess() {
    return readSmsMessagingAccess(this.organizationId);
  }
}
