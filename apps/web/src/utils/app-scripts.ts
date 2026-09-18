import { getServicesContainer } from "@/utils/utils";
import type {
  ConnectedAppData,
  IScriptProvider,
  Page,
  ScriptContribution,
} from "@hacado/types";

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

export function isJsScriptContribution(script: ScriptContribution): boolean {
  if (!script.type) return true;
  const normalized = script.type.toLowerCase();

  return (
    normalized === "text/javascript" ||
    normalized === "application/javascript" ||
    normalized === "module"
  );
}
