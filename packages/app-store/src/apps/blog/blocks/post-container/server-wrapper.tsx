import { BlogCommentsContext, BlogPost } from "../../models";
import { BlogPublicAllKeys } from "../../translations/types";
import { getBlogConfiguration } from "../get-blog-config";
import { BlogPostContainerComponent } from "./component";
import { BlogPostContainerReaderProps } from "./schema";

type BlogPostContainerServerWrapperProps = {
  props: BlogPostContainerReaderProps["props"];
  style: BlogPostContainerReaderProps["style"];
  blockBase?: { className?: string; id?: string };
  restProps: any;
  appId?: string;
  args?: BlogCommentsContext & {
    post?: BlogPost;
    _item?: BlogPost;
    slug?: string;
    params?: {
      slug?: string;
    };
  };
};

export const BlogPostContainerServerWrapper = async ({
  props,
  style,
  blockBase,
  restProps,
  appId,
  args,
}: BlogPostContainerServerWrapperProps) => {
  const { headers } = await import("next/headers");
  const { ServicesContainer } = await import("@hacado/services");
  const { BlogRepositoryService } = await import(
    "../../service/repository-service"
  );

  const logger = (await import("@hacado/logger")).getLoggerFactory(
    "BlogPostContainerServerWrapper",
  )("render");
  logger.info(
    { slug: args?.slug, hasPost: !!(args?._item ?? args?.post) },
    "Rendering blog post container",
  );

  const children = props?.children ?? [];

  // Get postUrl from props
  const postUrl = props?.postUrl ?? "/blog/[slug]";

  // Get post from _item (from ForeachContainer) or post (direct injection)
  let post = args?._item ?? args?.post ?? null;
  let error: BlogPublicAllKeys | null = null;

  const containerArgs = {
    ...args,
    post,
  };

  // Generate postLink by replacing [slug] with actual slug
  const generatePostLink = (slug: string | undefined): string | null => {
    if (!slug) return null;
    return postUrl.replace("[slug]", slug);
  };

  // If post already exists, use it
  if (post) {
    const postLink = generatePostLink(post.slug);
    logger.info(
      { title: post.title, id: post._id, slug: post.slug, postLink },
      "Post already exists",
    );
    return (
      <BlogPostContainerComponent
        args={containerArgs}
        post={post}
        error={null}
        postLink={postLink}
        children={children}
        style={style}
        blockBase={blockBase}
        restProps={restProps}
        isEditor={false}
        appId={appId}
      />
    );
  }

  // Try to get post by slug from args
  const slug = args?.params?.slug;
  if (!slug || !appId) {
    if (!slug) {
      logger.info({ slug, appId }, "No slug provided");
      error = "app_blog_public.notInBlogContext" satisfies BlogPublicAllKeys;
    } else {
      logger.info({ slug, appId }, "No appId provided");
      error = "app_blog_public.blogPostNotFound" satisfies BlogPublicAllKeys;
    }

    logger.info({ slug, appId, error }, "Returning error");
    return (
      <BlogPostContainerComponent
        args={containerArgs}
        post={null}
        error={error}
        postLink={null}
        children={children}
        style={style}
        blockBase={blockBase}
        restProps={restProps}
        isEditor={false}
        appId={appId}
      />
    );
  }

  // Fetch post by slug from database
  const headersList = await headers();
  const organizationId = headersList.get("x-organization-id") as string;

  if (!organizationId) {
    error = "app_blog_public.blogPostNotFound" satisfies BlogPublicAllKeys;
    logger.info({ organizationId, error }, "No organizationId provided");
    return (
      <BlogPostContainerComponent
        args={containerArgs}
        post={null}
        error={error}
        postLink={null}
        children={children}
        style={style}
        blockBase={blockBase}
        restProps={restProps}
        isEditor={false}
        appId={appId}
      />
    );
  }

  const servicesContainer = ServicesContainer(organizationId);

  // Get app service props to access getDbConnection
  const appServiceProps =
    servicesContainer.connectedAppsService.getAppServiceProps(appId);

  logger.info({ appId, organizationId }, "Creating repository service");

  // Create repository service directly
  const repositoryService = new BlogRepositoryService(
    appId,
    organizationId,
    appServiceProps.getDbConnection,
    appServiceProps.services,
  );

  const fetchedPost = await repositoryService.getBlogPost(undefined, slug);

  if (!fetchedPost) {
    error = "app_blog_public.blogPostNotFound" satisfies BlogPublicAllKeys;
  }

  const postLink = generatePostLink(fetchedPost?.slug);

  if (!args?.blogCommentsConfig) {
    logger.info({ organizationId, appId }, "Getting blog comments config");
    const blogCommentsConfig = await getBlogConfiguration(
      organizationId,
      appId,
    );
    containerArgs.blogCommentsConfig = blogCommentsConfig;
  }

  logger.info(
    {
      postLink,
      title: fetchedPost?.title,
      id: fetchedPost?._id,
      slug: fetchedPost?.slug,
    },
    "Post link generated",
  );

  return (
    <BlogPostContainerComponent
      args={containerArgs}
      post={fetchedPost}
      error={error}
      postLink={postLink}
      children={children}
      style={style}
      blockBase={blockBase}
      restProps={restProps}
      isEditor={false}
      appId={appId}
    />
  );
};
