import type { Page } from "../pages/page";
import type { ConnectedAppData } from "./connected-app.data";

/** Key-value pairs for Mustache SEO templates (e.g. { postTitle: "..." }). */
export type PageSeoArguments = Record<string, unknown>;

/**
 * Optional methods implemented by connected apps that declare the
 * `page-seo-arguments-provider` scope.
 */
export interface IPageSeoArgumentsProvider {
  /**
   * Provide Mustache variables for page title/description/keywords when the
   * URL has route params. Return undefined when this app does not handle the page.
   */
  providePageSeoArguments?(
    appData: ConnectedAppData,
    page: Page,
    params: Record<string, string>,
  ): Promise<PageSeoArguments | undefined>;
}
