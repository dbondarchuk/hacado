import { I18nText } from "@timelish/i18n/components";
import { BlogPublicAllKeys } from "../../translations/types";
import { BlogCommentsContainerComponent } from "./component";
import { BlogCommentsContainerReaderProps } from "./schema";

type BlogCommentsContainerServerWrapperProps = {
  props: BlogCommentsContainerReaderProps["props"];
  style: BlogCommentsContainerReaderProps["style"];
  blockBase?: { className?: string; id?: string };
  restProps: any;
  appId?: string;
  args?: {
    post?: { _id: string };
    blogCommentsConfig?: { commentsEnabled?: boolean };
    searchParams?: Record<string, string | string[] | undefined>;
    path?: string;
  };
};

export const BlogCommentsContainerServerWrapper = async ({
  props,
  style,
  blockBase,
  restProps,
  appId,
  args,
}: BlogCommentsContainerServerWrapperProps) => {
  const { headers } = await import("next/headers");
  const { ServicesContainer } = await import("@timelish/services");
  const { BlogRepositoryService } = await import(
    "../../service/repository-service"
  );

  const children = props?.children ?? [];
  const commentsPerPage = props?.commentsPerPage ?? 10;
  const sort = props?.sort ?? "newest";
  const postId = args?.post?._id;
  const commentsEnabled = args?.blogCommentsConfig?.commentsEnabled ?? false;
  const searchParams = args?.searchParams || {};
  const pageRaw = searchParams.commentsPage;
  const pageParsed = Array.isArray(pageRaw)
    ? parseInt(pageRaw[0] ?? "1", 10)
    : parseInt(String(pageRaw ?? "1"), 10);
  const page = Number.isFinite(pageParsed) && pageParsed > 0 ? pageParsed : 1;

  const containerArgs = {
    ...args,
  };

  if (!appId || !postId) {
    return (
      <div className="text-sm text-muted-foreground">
        <I18nText
          text={"app_blog_public.notInBlogContext" satisfies BlogPublicAllKeys}
        />
      </div>
    );
  }

  if (!commentsEnabled) {
    return (
      <BlogCommentsContainerComponent
        comments={[]}
        totalComments={0}
        page={page}
        commentsPerPage={commentsPerPage}
        children={children}
        style={style}
        blockBase={blockBase}
        restProps={restProps}
        appId={appId}
        args={containerArgs}
        showDisabled
      />
    );
  }

  const headersList = await headers();
  const organizationId = headersList.get("x-organization-id") as string;

  if (!organizationId) {
    return (
      <BlogCommentsContainerComponent
        comments={[]}
        totalComments={0}
        page={1}
        commentsPerPage={commentsPerPage}
        children={children}
        style={style}
        blockBase={blockBase}
        restProps={restProps}
        appId={appId}
        args={containerArgs}
      />
    );
  }

  const servicesContainer = ServicesContainer(organizationId);
  const appServiceProps =
    servicesContainer.connectedAppsService.getAppServiceProps(appId);
  const repositoryService = new BlogRepositoryService(
    appId,
    organizationId,
    appServiceProps.getDbConnection,
    appServiceProps.services,
  );

  const result = await repositoryService.getApprovedComments({
    postId,
    sort,
    page,
    limit: commentsPerPage,
  });

  return (
    <BlogCommentsContainerComponent
      comments={result.items ?? []}
      totalComments={result.total ?? 0}
      page={page}
      commentsPerPage={commentsPerPage}
      appId={appId}
      children={children}
      style={style}
      blockBase={blockBase}
      restProps={restProps}
      args={containerArgs}
    />
  );
};
