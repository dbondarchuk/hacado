import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  ConnectedAppData,
  ConnectedAppStatusWithText,
  IConnectedApp,
  IConnectedAppProps,
  IScriptProvider,
  LayoutScriptProviderContext,
  PageScriptProviderContext,
  ScriptContribution,
} from "@hacado/types";
import { template } from "@hacado/utils";
import {
  buildPageJsonLd,
  jsonLdScriptContent,
  loadSiteJsonLd,
} from "../../lib/public-discovery";
import {
  AutomaticStructuredDataAdminAllKeys,
  AutomaticStructuredDataAdminKeys,
  AutomaticStructuredDataAdminNamespace,
} from "./translations/types";

export class AutomaticStructuredDataConnectedApp
  implements IConnectedApp, IScriptProvider
{
  protected readonly loggerFactory: LoggerFactory;

  constructor(private readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "AutomaticStructuredDataConnectedApp",
      props.organizationId,
    );
  }

  public async processRequest(
    appData: ConnectedAppData,
  ): Promise<
    ConnectedAppStatusWithText<
      AutomaticStructuredDataAdminNamespace,
      AutomaticStructuredDataAdminKeys
    >
  > {
    const logger = this.loggerFactory("processRequest");
    logger.debug(
      { appId: appData._id },
      "Connecting Automatic Structured Data",
    );

    const status: ConnectedAppStatusWithText<
      AutomaticStructuredDataAdminNamespace,
      AutomaticStructuredDataAdminKeys
    > = {
      status: "connected",
      statusText:
        "app_automatic-structured-data_admin.statusText.successfully_set_up" satisfies AutomaticStructuredDataAdminAllKeys,
    };

    await this.props.update({ ...status });
    logger.info({ appId: appData._id }, "Automatic Structured Data connected");
    return status;
  }

  public async provideLayoutHeaderScripts(
    appData: ConnectedAppData,
    ctx: LayoutScriptProviderContext,
  ): Promise<ScriptContribution[] | undefined> {
    if (appData.status !== "connected") return undefined;

    const { general, brand, social, schedule } =
      await this.props.services.configurationService.getConfigurations(
        "general",
        "brand",
        "social",
        "schedule",
      );

    if (!general?.name || !brand) return undefined;

    const graph = await loadSiteJsonLd(
      this.props.services,
      ctx.websiteUrl,
      general,
      brand,
      social,
      schedule,
    );

    return [
      {
        source: "inline",
        type: "application/ld+json",
        id: "site-json-ld",
        value: jsonLdScriptContent(graph),
      },
    ];
  }

  public async providePageHeaderScripts(
    appData: ConnectedAppData,
    ctx: PageScriptProviderContext,
  ): Promise<ScriptContribution[] | undefined> {
    if (appData.status !== "connected") return undefined;

    const seoArgs = ctx.routeParams || {};
    const name = template(ctx.page.title, seoArgs, true);
    const description = template(ctx.page.description, seoArgs, true);
    const graph = buildPageJsonLd({
      websiteUrl: ctx.websiteUrl,
      slug: ctx.page.slug,
      name,
      description,
      dateModified: ctx.page.updatedAt,
    });

    return [
      {
        source: "inline",
        type: "application/ld+json",
        id: "page-json-ld",
        value: jsonLdScriptContent(graph),
      },
    ];
  }
}
