import { I18nText } from "@timelish/i18n/components";
import { BlogCommentsContext, BlogPost } from "../../models";
import { BlogPublicAllKeys } from "../../translations/types";
import { getBlogConfiguration } from "../get-blog-config";
import { BlogPostsContainerComponent } from "./component";
import { BlogPostsContainerReaderProps } from "./schema";

type BlogPostsContainerServerWrapperProps = {
  props: BlogPostsContainerReaderProps["props"];
  style: BlogPostsContainerReaderProps["style"];
  blockBase?: { className?: string; id?: string };
  restProps: any;
  appId?: string;
  args?: BlogCommentsContext & {
    posts?: BlogPost[];
    totalPosts?: number;
    page?: number;
    postsPerPage?: number;
    tag?: string;
    searchParams?: Record<string, string | string[] | undefined>;
  };
};

export const BlogPostsContainerServerWrapper = async ({
  props,
  style,
  blockBase,
  restProps,
  appId,
  args,
}: BlogPostsContainerServerWrapperProps) => {
  const { headers } = await import("next/headers");
  const { ServicesContainer } = await import("@timelish/services");
  const { BlogRepositoryService } = await import(
    "../../service/repository-service"
  );

  const logger = (await import("@timelish/logger")).getLoggerFactory(
    "BlogPostsContainerServerWrapper",
  )("render");

  const children = props?.children ?? [];
  const postsPerPage = props?.postsPerPage ?? 10;
  const headersList = await headers();
  const organizationId = headersList.get("x-organization-id") as string;
  const containerArgs = {
    ...args,
  };

  logger.info(
    { page: args?.page, postsPerPage, tag: args?.tag, organizationId, appId },
    "Rendering blog posts container",
  );

  if (!args?.blogCommentsConfig) {
    logger.info({ organizationId, appId }, "Getting blog comments config");
    const blogCommentsConfig =
      appId && organizationId
        ? await getBlogConfiguration(organizationId, appId)
        : args?.blogCommentsConfig;

    containerArgs.blogCommentsConfig = blogCommentsConfig;
  }

  // If posts already provided in args, use them
  if (args?.posts) {
    logger.info({ posts: args.posts }, "Posts already provided in args");
    return (
      <BlogPostsContainerComponent
        posts={args.posts}
        totalPosts={args.totalPosts ?? args.posts.length}
        page={args.page ?? 1}
        postsPerPage={postsPerPage}
        tag={args.tag}
        children={children}
        style={style}
        blockBase={blockBase}
        restProps={restProps}
        isEditor={false}
        appId={appId}
        args={containerArgs}
      />
    );
  }

  // Fetch from database if appId is provided
  if (!appId) {
    logger.info({ appId }, "No appId provided");
    return (
      <div className="flex flex-col gap-2">
        <div className="text-red-500">
          <I18nText
            text={
              "app_blog_public.errors.blogAppNotConfigured.title" satisfies BlogPublicAllKeys
            }
          />
        </div>
        <p className="text-sm text-gray-500">
          <I18nText
            text={
              "app_blog_public.errors.blogAppNotConfigured.description" satisfies BlogPublicAllKeys
            }
          />
        </p>
      </div>
    );
  }

  // Get page and tag from search params
  const searchParams = args?.searchParams || {};
  const page = searchParams.page ? parseInt(String(searchParams.page), 10) : 1;
  const tag = searchParams.tag ? String(searchParams.tag) : undefined;

  logger.info({ page, tag }, "Getting page and tag from search params");

  // Get services and fetch posts
  if (!organizationId) {
    // Fallback to empty array if no organizationId
    logger.info({ organizationId }, "No organizationId provided");
    return (
      <BlogPostsContainerComponent
        posts={[]}
        totalPosts={0}
        page={1}
        postsPerPage={postsPerPage}
        children={children}
        style={style}
        blockBase={blockBase}
        restProps={restProps}
        isEditor={false}
        appId={appId}
        args={containerArgs}
      />
    );
  }

  const servicesContainer = ServicesContainer(organizationId);

  // Get app service props to access getDbConnection
  const appServiceProps =
    servicesContainer.connectedAppsService.getAppServiceProps(appId);

  // Create repository service directly
  const repositoryService = new BlogRepositoryService(
    appId,
    organizationId,
    appServiceProps.getDbConnection,
    appServiceProps.services,
  );

  const limit = postsPerPage;
  const offset = (page - 1) * limit;

  const result = await repositoryService.getBlogPosts({
    offset,
    limit,
    tag,
    isPublished: true,
  });

  logger.info(
    { total: result.total, items: result.items?.length },
    "Returning blog posts container",
  );

  return (
    <BlogPostsContainerComponent
      posts={result.items || []}
      totalPosts={result.total}
      page={page}
      postsPerPage={postsPerPage}
      tag={tag}
      children={children}
      style={style}
      blockBase={blockBase}
      restProps={restProps}
      isEditor={false}
      appId={appId}
      args={containerArgs}
    />
  );
};
