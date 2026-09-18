import type { Page } from "../pages/page";
import type { ConnectedAppData } from "./connected-app.data";

/**
 * Next.js-compatible metadata contribution. Deep-merged into page metadata:
 * objects recurse, arrays concatenate, primitives last-write-wins.
 */
export type AppPageMetadata = {
  [key: string]: unknown;
};

/** File/body contributions for discovery routes (not Next.js Metadata). */
export type PageContentEntry = { type: string; value: string };

/**
 * Optional methods implemented by connected apps that declare the
 * `page-metadata-provider` scope.
 */
export interface IPageMetadataProvider {
  /**
   * Next.js Metadata fields for the current CMS page. Deep-merged with the
   * base page metadata (last non-undefined primitive wins; arrays concat).
   */
  providePageMetadata?(
    appData: ConnectedAppData,
    ctx: {
      websiteUrl: string;
      page: Page;
      routeParams: Record<string, string>;
    },
  ): Promise<AppPageMetadata | undefined>;

  /**
   * Site-wide discovery file bodies (e.g. `llms.txt`). Served by API routes.
   */
  provideSiteBodies?(
    appData: ConnectedAppData,
    ctx: { websiteUrl: string },
  ): Promise<PageContentEntry[] | undefined>;

  /**
   * Per-page discovery file bodies (e.g. `text/markdown` for `/{slug}.md`).
   */
  providePageBodies?(
    appData: ConnectedAppData,
    ctx: {
      websiteUrl: string;
      page: Page;
      routeParams: Record<string, string>;
    },
  ): Promise<PageContentEntry[] | undefined>;
}
