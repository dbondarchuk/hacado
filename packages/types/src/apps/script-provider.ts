import type { Page } from "../pages/page";
import type { ConnectedAppData } from "./connected-app.data";

export type ScriptContribution = {
  type?: string;
  id?: string;
} & ({ source: "inline"; value: string } | { source: "remote"; url: string });

export type LayoutScriptProviderContext = {
  websiteUrl: string;
};

export type PageScriptProviderContext = {
  websiteUrl: string;
  page: Page;
  routeParams: Record<string, string>;
};

/**
 * Optional methods implemented by connected apps that declare the
 * `script-provider` scope.
 *
 * Layout methods run from the root layout (site-wide). Page methods run when
 * rendering a CMS page.
 */
export interface IScriptProvider {
  provideLayoutHeaderScripts?(
    appData: ConnectedAppData,
    ctx: LayoutScriptProviderContext,
  ): Promise<ScriptContribution[] | undefined>;
  provideLayoutFooterScripts?(
    appData: ConnectedAppData,
    ctx: LayoutScriptProviderContext,
  ): Promise<ScriptContribution[] | undefined>;
  providePageHeaderScripts?(
    appData: ConnectedAppData,
    ctx: PageScriptProviderContext,
  ): Promise<ScriptContribution[] | undefined>;
  providePageFooterScripts?(
    appData: ConnectedAppData,
    ctx: PageScriptProviderContext,
  ): Promise<ScriptContribution[] | undefined>;
}
