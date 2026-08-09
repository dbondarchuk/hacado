import { plateValueToPlainTextDescription } from "@hacado/rte";
import type {
  ConnectedAppData,
  IConnectedAppProps,
  Page,
  PageSeoArguments,
} from "@hacado/types";
import { getWebsiteUrl } from "@hacado/utils";
import { resolveAuthorNameFromPostAsync } from "../blocks/post-author/resolve-author";
import { pageUsesBlogApp } from "./blog-sitemap";
import { BlogRepositoryService } from "./repository-service";

function toAbsoluteWebsiteUrl(websiteUrl: string, pathOrUrl: string): string {
  const trimmed = pathOrUrl.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = websiteUrl.replace(/\/$/, "");
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
}

export async function provideBlogPageSeoArguments(
  props: IConnectedAppProps,
  page: Page,
  params: Record<string, string>,
  appData: ConnectedAppData,
): Promise<PageSeoArguments | undefined> {
  if (appData.status !== "connected") return undefined;

  const slug = params.slug;
  if (!slug) return undefined;

  if (!pageUsesBlogApp(page, appData._id)) return undefined;

  const repository = new BlogRepositoryService(
    appData._id,
    appData.organizationId,
    props.getDbConnection,
    props.services,
  );
  const post = await repository.getBlogPost(undefined, slug);
  if (!post || !post.isPublished) return undefined;

  const postAuthor =
    (await resolveAuthorNameFromPostAsync(post, appData.organizationId)) ??
    undefined;

  const postDescription = plateValueToPlainTextDescription(post.content, 3);

  let postFeaturedImage: string | undefined;
  if (post.featuredImage?.trim()) {
    const organization =
      await props.services.organizationService.getOrganization();
    if (organization) {
      postFeaturedImage = toAbsoluteWebsiteUrl(
        getWebsiteUrl(organization),
        post.featuredImage,
      );
    }
  }

  return {
    postTitle: post.title,
    postSlug: post.slug,
    postTags: (post.tags ?? []).join(", "),
    postAuthor: postAuthor ?? "",
    postDescription: postDescription ?? "",
    postFeaturedImage: postFeaturedImage ?? "",
    featuredImage: postFeaturedImage,
  };
}
