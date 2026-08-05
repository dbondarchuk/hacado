import type {
  ConnectedAppData,
  IConnectedAppProps,
  Page,
  SitemapUrlEntry,
} from "@hacado/types";
import { BlogRepositoryService } from "./repository-service";

function blogPathPrefixFromPageSlug(slug: string): string | null {
  if (slug === "[slug]") return "";
  const m = slug.match(/^(.*)\/\[slug\]$/);
  return m ? m[1] : null;
}

function visitPageDocumentBlocks(
  node: unknown,
  visitor: (block: Record<string, unknown>) => void,
): void {
  if (!node || typeof node !== "object") return;
  const n = node as Record<string, unknown>;
  visitor(n);
  const data = n.data;
  if (data && typeof data === "object") {
    const children = (data as Record<string, unknown>).children;
    if (Array.isArray(children)) {
      for (const child of children) {
        visitPageDocumentBlocks(child, visitor);
      }
    }
  }
}

function pageUsesBlogApp(page: Page, appId: string): boolean {
  if (!page.content) return false;
  let found = false;
  visitPageDocumentBlocks(page.content, (block) => {
    if (block.type !== "BlogPostContainer") return;
    const metadata = block.metadata;
    if (!metadata || typeof metadata !== "object") return;
    const blogAppId = (metadata as { blogAppId?: string }).blogAppId;
    if (blogAppId === appId) found = true;
  });
  return found;
}

function absolutePostUrl(
  siteUrl: string,
  pathPrefix: string,
  postSlug: string,
): string {
  const base = siteUrl.replace(/\/$/, "");
  const path = pathPrefix ? `${pathPrefix}/${postSlug}` : postSlug;
  return `${base}/${path}`;
}

async function fetchAllPublishedBlogPosts(
  repository: BlogRepositoryService,
): Promise<{ slug: string; updatedAt: Date }[]> {
  const batchSize = 500;
  const posts: { slug: string; updatedAt: Date }[] = [];
  let offset = 0;

  for (;;) {
    const { items, total } = await repository.getBlogPosts({
      offset,
      limit: batchSize,
      isPublished: true,
    });
    for (const p of items) {
      posts.push({ slug: p.slug, updatedAt: p.updatedAt });
    }
    offset += items.length;
    if (offset >= total || items.length === 0) break;
  }

  return posts;
}

export async function expandBlogPlaceholderPageSitemapItems(
  props: IConnectedAppProps,
  websiteUrl: string,
  page: Page,
  appData: ConnectedAppData,
): Promise<SitemapUrlEntry[] | undefined> {
  if (appData.status !== "connected") return undefined;

  const pathPrefix = blogPathPrefixFromPageSlug(page.slug);
  if (pathPrefix === null) return undefined;

  if (!pageUsesBlogApp(page, appData._id)) return undefined;

  const repository = new BlogRepositoryService(
    appData._id,
    appData.organizationId,
    props.getDbConnection,
    props.services,
  );
  const posts = await fetchAllPublishedBlogPosts(repository);

  return posts.map((post) => ({
    url: absolutePostUrl(websiteUrl, pathPrefix, post.slug),
    lastModified: post.updatedAt,
    priority: 0.7,
  }));
}
