import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import { resolvePlanTierFromOrganization } from "@hacado/services/billing";
import {
  ConnectedAppData,
  ConnectedAppRequestError,
  ConnectedAppStatusWithText,
  IConnectedApp,
  IConnectedAppProps,
  IScriptProvider,
  LayoutScriptProviderContext,
  PageScriptProviderContext,
  ScriptContribution,
} from "@hacado/types/apps";
import { canProcessApp } from "../../subscription-plan-access";
import {
  CustomScript,
  CustomScriptsConfiguration,
  customScriptsConfigurationSchema,
  RequestAction,
  requestActionSchema,
} from "./models";
import {
  CustomScriptsAdminAllKeys,
  CustomScriptsAdminKeys,
  CustomScriptsAdminNamespace,
} from "./translations/types";

function toContribution(
  script: CustomScript,
  index: number,
): ScriptContribution {
  const id = `custom-script-${script.placement}-${index}`;
  const runOnEveryPage = script.runOnEveryPage || undefined;

  if (script.source === "inline") {
    return {
      source: "inline",
      value: script.value,
      id,
      runOnEveryPage,
    };
  }

  return {
    source: "remote",
    url: script.url,
    id,
    async: script.strategy === "async" ? true : undefined,
    defer: script.strategy === "defer" ? true : undefined,
    runOnEveryPage,
  };
}

export class CustomScriptsConnectedApp
  implements IConnectedApp, IScriptProvider
{
  protected readonly loggerFactory: LoggerFactory;

  constructor(private readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "CustomScriptsConnectedApp",
      props.organizationId,
    );
  }

  public async install(appData: ConnectedAppData): Promise<void> {
    const logger = this.loggerFactory("install");
    logger.debug({ appId: appData._id }, "Installing Custom Scripts");

    await this.props.update({
      status: "connected",
      statusText:
        "app_custom-scripts_admin.statusText.successfully_set_up" satisfies CustomScriptsAdminAllKeys,
      data: { scripts: [] } satisfies CustomScriptsConfiguration,
    });

    logger.info({ appId: appData._id }, "Custom Scripts installed");
  }

  public async processRequest(
    appData: ConnectedAppData,
    request: RequestAction,
  ): Promise<
    ConnectedAppStatusWithText<
      CustomScriptsAdminNamespace,
      CustomScriptsAdminKeys
    >
  > {
    const logger = this.loggerFactory("processRequest");
    const parsed = requestActionSchema.safeParse(request);

    if (!parsed.success) {
      logger.error({ error: parsed.error }, "Invalid Custom Scripts request");
      throw new ConnectedAppRequestError(
        "invalid_custom_scripts_request",
        { request },
        400,
        parsed.error.message,
      );
    }

    try {
      const configuration = customScriptsConfigurationSchema.parse(
        parsed.data.configuration,
      );

      const status: ConnectedAppStatusWithText<
        CustomScriptsAdminNamespace,
        CustomScriptsAdminKeys
      > = {
        status: "connected",
        statusText:
          "app_custom-scripts_admin.statusText.successfully_set_up" satisfies CustomScriptsAdminAllKeys,
      };

      await this.props.update({
        data: configuration,
        ...status,
      });

      logger.info({ appId: appData._id }, "Custom Scripts configuration saved");
      return status;
    } catch (error: any) {
      logger.error(
        { appId: appData._id, error },
        "Error saving Custom Scripts configuration",
      );

      await this.props.update({
        status: "failed",
        statusText:
          "app_custom-scripts_admin.statusText.error_processing_configuration" satisfies CustomScriptsAdminAllKeys,
      });

      throw error;
    }
  }

  private async canProvide(
    appData: ConnectedAppData<CustomScriptsConfiguration>,
  ): Promise<boolean> {
    if (appData.status !== "connected") return false;

    const organization =
      await this.props.services.organizationService.getOrganization();

    const planTier = resolvePlanTierFromOrganization(organization);

    return canProcessApp(planTier, appData.name);
  }

  private getScripts(
    appData: ConnectedAppData<CustomScriptsConfiguration>,
  ): CustomScript[] {
    return appData.data?.scripts ?? [];
  }

  private filterScripts(
    scripts: CustomScript[],
    placement: "header" | "footer",
    mode: "layout" | "page",
    pageId?: string,
  ): CustomScript[] {
    return scripts.filter((script) => {
      if (!script.enabled) return false;
      if (script.placement !== placement) return false;

      const pageIds = script.pageIds ?? [];

      if (mode === "layout") {
        return pageIds.length === 0;
      }

      return !!pageId && pageIds.includes(pageId);
    });
  }

  public async provideLayoutHeaderScripts(
    appData: ConnectedAppData<CustomScriptsConfiguration>,
    _ctx: LayoutScriptProviderContext,
  ): Promise<ScriptContribution[] | undefined> {
    if (!(await this.canProvide(appData))) return undefined;

    const scripts = this.filterScripts(
      this.getScripts(appData),
      "header",
      "layout",
    );

    if (!scripts.length) return undefined;

    return scripts.map((script, index) => toContribution(script, index));
  }

  public async provideLayoutFooterScripts(
    appData: ConnectedAppData<CustomScriptsConfiguration>,
    _ctx: LayoutScriptProviderContext,
  ): Promise<ScriptContribution[] | undefined> {
    if (!(await this.canProvide(appData))) return undefined;

    const scripts = this.filterScripts(
      this.getScripts(appData),
      "footer",
      "layout",
    );

    if (!scripts.length) return undefined;

    return scripts.map((script, index) => toContribution(script, index));
  }

  public async providePageHeaderScripts(
    appData: ConnectedAppData<CustomScriptsConfiguration>,
    ctx: PageScriptProviderContext,
  ): Promise<ScriptContribution[] | undefined> {
    if (!(await this.canProvide(appData))) return undefined;

    const scripts = this.filterScripts(
      this.getScripts(appData),
      "header",
      "page",
      ctx.page._id,
    );

    if (!scripts.length) return undefined;

    return scripts.map((script, index) => toContribution(script, index));
  }

  public async providePageFooterScripts(
    appData: ConnectedAppData<CustomScriptsConfiguration>,
    ctx: PageScriptProviderContext,
  ): Promise<ScriptContribution[] | undefined> {
    if (!(await this.canProvide(appData))) return undefined;

    const scripts = this.filterScripts(
      this.getScripts(appData),
      "footer",
      "page",
      ctx.page._id,
    );

    if (!scripts.length) return undefined;

    return scripts.map((script, index) => toContribution(script, index));
  }
}
