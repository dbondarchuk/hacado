import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  AppPageMetadata,
  ConnectedAppData,
  ConnectedAppStatusWithText,
  IConnectedApp,
  IConnectedAppProps,
  ILlmsFullTxtProvider,
  IPageMetadataProvider,
  Page,
  PageContentEntry,
  pageSlugHasPlaceholder,
} from "@hacado/types";
import {
  buildLlmsFullTxt,
  buildLlmsTxt,
  buildPageMarkdown,
  pageMarkdownPath,
  toAbsoluteUrl,
} from "../../lib/public-discovery";
import {
  AutomaticAiDiscoveryAdminAllKeys,
  AutomaticAiDiscoveryAdminKeys,
  AutomaticAiDiscoveryAdminNamespace,
} from "./translations/types";

export class AutomaticAiDiscoveryConnectedApp
  implements IConnectedApp, IPageMetadataProvider, ILlmsFullTxtProvider
{
  protected readonly loggerFactory: LoggerFactory;

  constructor(private readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "AutomaticAiDiscoveryConnectedApp",
      props.organizationId,
    );
  }

  public async processRequest(
    appData: ConnectedAppData,
  ): Promise<
    ConnectedAppStatusWithText<
      AutomaticAiDiscoveryAdminNamespace,
      AutomaticAiDiscoveryAdminKeys
    >
  > {
    const logger = this.loggerFactory("processRequest");
    logger.debug({ appId: appData._id }, "Connecting Automatic AI Discovery");

    const status: ConnectedAppStatusWithText<
      AutomaticAiDiscoveryAdminNamespace,
      AutomaticAiDiscoveryAdminKeys
    > = {
      status: "connected",
      statusText:
        "app_automatic-ai-discovery_admin.statusText.successfully_set_up" satisfies AutomaticAiDiscoveryAdminAllKeys,
    };

    await this.props.update({ ...status });
    logger.info({ appId: appData._id }, "Automatic AI Discovery connected");
    return status;
  }

  public async providePageMetadata(
    appData: ConnectedAppData,
    ctx: {
      websiteUrl: string;
      page: Page;
      routeParams: Record<string, string>;
    },
  ): Promise<AppPageMetadata | undefined> {
    if (appData.status !== "connected") return undefined;
    if (pageSlugHasPlaceholder(ctx.page.slug)) return undefined;
    if (!ctx.page.published || ctx.page.publishDate > new Date()) {
      return undefined;
    }

    return {
      alternates: {
        types: {
          "text/markdown": toAbsoluteUrl(
            ctx.websiteUrl,
            pageMarkdownPath(ctx.page.slug),
          ),
        },
      },
    };
  }

  public async provideSiteBodies(
    appData: ConnectedAppData,
    ctx: { websiteUrl: string },
  ): Promise<PageContentEntry[] | undefined> {
    if (appData.status !== "connected") return undefined;

    const body = await buildLlmsTxt(this.props.services, ctx.websiteUrl);
    if (!body) return undefined;
    return [{ type: "llms.txt", value: body }];
  }

  public async providePageBodies(
    appData: ConnectedAppData,
    ctx: {
      websiteUrl: string;
      page: Page;
      routeParams: Record<string, string>;
    },
  ): Promise<PageContentEntry[] | undefined> {
    if (appData.status !== "connected") return undefined;

    const body = await buildPageMarkdown(
      this.props.services,
      ctx.websiteUrl,
      ctx.page,
    );

    if (!body) return undefined;
    return [{ type: "text/markdown", value: body }];
  }

  public async provideLlmsFullTxt(
    appData: ConnectedAppData,
    ctx: { websiteUrl: string },
  ): Promise<string | undefined> {
    if (appData.status !== "connected") return undefined;

    const body = await buildLlmsFullTxt(this.props.services, ctx.websiteUrl);
    return body ?? undefined;
  }
}
