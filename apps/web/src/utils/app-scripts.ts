import { getServicesContainer } from "@/utils/utils";
import type {
  ConnectedAppData,
  IScriptProvider,
  ScriptContribution,
} from "@hacado/types/apps";
import type { Page } from "@hacado/types/pages";

export { isJsScriptContribution } from "./is-js-script-contribution";

async function invokeScriptProvider(
  callback: (
    appData: ConnectedAppData,
    service: IScriptProvider,
  ) => Promise<ScriptContribution[] | undefined>,
): Promise<ScriptContribution[]> {
  const servicesContainer = await getServicesContainer();
  const batches =
    await servicesContainer.connectedAppsService.invokeAppsByScope<
      IScriptProvider,
      ScriptContribution[] | undefined
    >("script-provider", callback, { ignoreErrors: true });

  return batches.flatMap((batch) => batch || []);
}

export function collectLayoutHeaderScripts(websiteUrl: string) {
  return invokeScriptProvider(async (appData, service) => {
    if (typeof service.provideLayoutHeaderScripts !== "function") {
      return undefined;
    }

    return service.provideLayoutHeaderScripts(appData, { websiteUrl });
  });
}

export function collectLayoutFooterScripts(websiteUrl: string) {
  return invokeScriptProvider(async (appData, service) => {
    if (typeof service.provideLayoutFooterScripts !== "function") {
      return undefined;
    }

    return service.provideLayoutFooterScripts(appData, { websiteUrl });
  });
}

export function collectPageHeaderScripts(
  websiteUrl: string,
  page: Page,
  routeParams: Record<string, string>,
) {
  return invokeScriptProvider(async (appData, service) => {
    if (typeof service.providePageHeaderScripts !== "function") {
      return undefined;
    }

    return service.providePageHeaderScripts(appData, {
      websiteUrl,
      page,
      routeParams,
    });
  });
}

export function collectPageFooterScripts(
  websiteUrl: string,
  page: Page,
  routeParams: Record<string, string>,
) {
  return invokeScriptProvider(async (appData, service) => {
    if (typeof service.providePageFooterScripts !== "function") {
      return undefined;
    }

    return service.providePageFooterScripts(appData, {
      websiteUrl,
      page,
      routeParams,
    });
  });
}
