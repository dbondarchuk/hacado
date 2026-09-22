import type { ConnectedAppData } from "./connected-app.data";

export type PublicPageClaim = {
  /** Exact CMS-style slug this app owns (e.g. `"payment"`). */
  slug: string;
  noIndex?: boolean;
};

export type PublicPageChrome = {
  headerId?: string;
  footerId?: string;
  title?: string;
};

export type PublicPageChromeContext = {
  slug: string;
  searchParams: Record<string, string | string[] | undefined>;
  websiteUrl: string;
};

/**
 * Optional methods for apps that declare the `public-page-provider` scope.
 * Claimed exact slugs take over rendering in the public catch-all route.
 */
export interface IPublicPageProvider {
  getPublicPageClaims(
    appData: ConnectedAppData,
  ): Promise<PublicPageClaim[]> | PublicPageClaim[];

  getPublicPageChrome?(
    appData: ConnectedAppData,
    ctx: PublicPageChromeContext,
  ): Promise<PublicPageChrome | undefined> | PublicPageChrome | undefined;
}

export type PublicPageRendererProps = {
  appId: string;
  appName: string;
  searchParams: Record<string, string | string[] | undefined>;
  websiteUrl: string;
};
