import { getLoggerFactory, LoggerFactory } from "@timelish/logger";
import {
  ApiRequest,
  ApiResponse,
  ConnectedAppData,
  ConnectedAppRequestError,
  ConnectedAppStatusWithText,
  ConnectedAppUninstallResult,
  DashboardNotification,
  EventSource,
  IConnectedApp,
  IConnectedAppProps,
  IDashboardNotifierApp,
  ISitemapItemsProvider,
  Page,
  SessionUser,
  SitemapUrlEntry,
} from "@timelish/types";
import {
  BLOG_COMMENT_CREATED_EVENT_TYPE,
  BLOG_COMMENT_DELETED_EVENT_TYPE,
  BLOG_COMMENT_STATUS_CHANGED_EVENT_TYPE,
  BLOG_POST_CREATED_EVENT_TYPE,
  BLOG_POST_DELETED_EVENT_TYPE,
  BLOG_POST_UPDATED_EVENT_TYPE,
} from "../events";
import {
  ApproveBlogCommentAction,
  ApproveBlogCommentActionType,
  ApproveSelectedBlogCommentsAction,
  ApproveSelectedBlogCommentsActionType,
  BlogConfiguration,
  blogConfigurationSchema,
  CheckBlogPostSlugUniqueAction,
  CheckBlogPostSlugUniqueActionType,
  createBlogCommentSchema,
  CreateBlogPostAction,
  CreateBlogPostActionType,
  DeleteBlogCommentAction,
  DeleteBlogCommentActionType,
  DeleteBlogPostAction,
  DeleteBlogPostActionType,
  DeleteSelectedBlogCommentsAction,
  DeleteSelectedBlogCommentsActionType,
  DeleteSelectedBlogPostsAction,
  DeleteSelectedBlogPostsActionType,
  GetBlogCommentsAction,
  GetBlogCommentsActionType,
  GetBlogPostAction,
  GetBlogPostActionType,
  GetBlogPostsAction,
  GetBlogPostsActionType,
  GetBlogTagsAction,
  GetBlogTagsActionType,
  getPublicBlogCommentsQuerySchema,
  RejectBlogCommentAction,
  RejectBlogCommentActionType,
  RejectSelectedBlogCommentsAction,
  RejectSelectedBlogCommentsActionType,
  RequestAction,
  requestActionSchema,
  SetConfigurationActionType,
  UpdateBlogPostAction,
  UpdateBlogPostActionType,
} from "../models";
import {
  BlogAdminAllKeys,
  BlogAdminKeys,
  BlogAdminNamespace,
} from "../translations/types";
import { expandBlogPlaceholderPageSitemapItems } from "./blog-sitemap";
import { getBlogPendingCommentsBadges } from "./pending-comments-badge";
import {
  BLOG_COMMENTS_COLLECTION_NAME,
  BLOG_POSTS_COLLECTION_NAME,
  BlogRepositoryService,
} from "./repository-service";

export class BlogConnectedApp
  implements IConnectedApp, ISitemapItemsProvider, IDashboardNotifierApp
{
  protected readonly loggerFactory: LoggerFactory;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "BlogConnectedApp",
      props.organizationId,
    );
  }

  public async getInitialNotifications(
    appData: ConnectedAppData,
    _memberId: string,
    _date?: Date,
  ): Promise<DashboardNotification[]> {
    const badges = await getBlogPendingCommentsBadges(
      appData._id,
      appData.organizationId,
      this.props.getDbConnection,
      this.props.services,
    );

    return [
      {
        type: "blog-pending-comments",
        badges,
      },
    ];
  }

  public async processRequest(
    appData: ConnectedAppData,
    request: RequestAction,
    _apiRequest?: ApiRequest,
    user?: SessionUser,
  ): Promise<any> {
    const logger = this.loggerFactory("processRequest");
    logger.debug({ appId: appData._id }, "Processing blog request");

    const memberId = user?.memberId;
    const { data, success, error } = requestActionSchema.safeParse(request);
    if (!success) {
      logger.error({ error }, "Invalid blog request");
      throw new ConnectedAppRequestError(
        "invalid_blog_request",
        { data },
        400,
        error.message,
      );
    }
    switch (data.type) {
      case GetBlogPostsActionType:
        return this.processGetBlogPostsRequest(appData, data);
      case GetBlogPostActionType:
        return this.processGetBlogPostRequest(appData, data);
      case CreateBlogPostActionType:
        return this.processCreateBlogPostRequest(appData, data, memberId);
      case UpdateBlogPostActionType:
        return this.processUpdateBlogPostRequest(appData, data, memberId);
      case DeleteBlogPostActionType:
        return this.processDeleteBlogPostRequest(appData, data, memberId);
      case DeleteSelectedBlogPostsActionType:
        return this.processDeleteBlogPostsRequest(appData, data, memberId);
      case GetBlogTagsActionType:
        return this.processGetBlogTagsRequest(appData, data);
      case CheckBlogPostSlugUniqueActionType:
        return this.processCheckBlogPostSlugUniqueRequest(appData, data);
      case GetBlogCommentsActionType:
        return this.processGetBlogCommentsRequest(appData, data);
      case ApproveBlogCommentActionType:
        return this.processApproveBlogCommentRequest(appData, data, memberId);
      case RejectBlogCommentActionType:
        return this.processRejectBlogCommentRequest(appData, data, memberId);
      case DeleteBlogCommentActionType:
        return this.processDeleteBlogCommentRequest(appData, data, memberId);
      case DeleteSelectedBlogCommentsActionType:
        return this.processDeleteBlogCommentsRequest(appData, data, memberId);
      case ApproveSelectedBlogCommentsActionType:
        return this.processApproveBlogCommentsRequest(appData, data);
      case RejectSelectedBlogCommentsActionType:
        return this.processRejectBlogCommentsRequest(appData, data);
      case SetConfigurationActionType:
        return this.processSetConfigurationRequest(appData, data.configuration);
      default: {
        const _exhaustive: never = data;
        throw new ConnectedAppRequestError(
          "invalid_blog_request",
          { data: _exhaustive },
          400,
          "Unknown blog request type",
        );
      }
    }
  }

  public async unInstall(
    appData: ConnectedAppData,
  ): Promise<ConnectedAppUninstallResult> {
    const logger = this.loggerFactory("unInstall");
    logger.debug({ appId: appData._id }, "Uninstalling blog app");

    try {
      const db = await this.props.getDbConnection();
      const collection = db.collection(BLOG_POSTS_COLLECTION_NAME);
      await collection.deleteMany({
        appId: appData._id,
      });

      const count = await collection.countDocuments({});
      if (count === 0) {
        await db.dropCollection(BLOG_POSTS_COLLECTION_NAME);
      }

      const commentsCollection = db.collection(BLOG_COMMENTS_COLLECTION_NAME);
      await commentsCollection.deleteMany({ appId: appData._id });
      const commentsCount = await commentsCollection.countDocuments({});
      if (commentsCount === 0) {
        await db.dropCollection(BLOG_COMMENTS_COLLECTION_NAME);
      }

      logger.info({ appId: appData._id }, "Successfully uninstalled blog app");
      return { success: true, code: "ok" };
    } catch (error: any) {
      logger.error(
        { appId: appData._id, error: error?.message || error?.toString() },
        "Error uninstalling blog app",
      );
      throw error;
    }
  }

  public async install(appData: ConnectedAppData): Promise<void> {
    const logger = this.loggerFactory("install");
    logger.debug({ appId: appData._id }, "Installing blog app");

    try {
      const repositoryService = this.getRepositoryService(
        appData._id,
        appData.organizationId,
      );

      await repositoryService.install();

      logger.debug({ appId: appData._id }, "Blog app installed successfully");
    } catch (error: any) {
      logger.error({ appId: appData._id, error }, "Error installing blog app");
      throw error;
    }
  }

  public async processAppCall(
    appData: ConnectedAppData<BlogConfiguration>,
    slug: string[],
    request: ApiRequest,
  ): Promise<ApiResponse> {
    if (slug.length === 1 && slug[0] === "comments") {
      if (request.method.toUpperCase() === "POST") {
        return this.processCreateBlogCommentAppCall(appData, request);
      }
      if (request.method.toUpperCase() === "GET") {
        return this.processGetBlogCommentsAppCall(appData, request);
      }
    }

    return Response.json(
      { success: false, error: "Unknown request" },
      { status: 404 },
    );
  }

  private getBlogConfiguration(
    appData: ConnectedAppData<BlogConfiguration>,
  ): BlogConfiguration {
    return blogConfigurationSchema.parse(appData.data ?? {});
  }

  private async processCreateBlogCommentAppCall(
    appData: ConnectedAppData<BlogConfiguration>,
    request: ApiRequest,
  ): Promise<ApiResponse> {
    const logger = this.loggerFactory("processCreateBlogCommentAppCall");
    const config = this.getBlogConfiguration(appData);

    if (!config.commentsEnabled) {
      return Response.json(
        { success: false, error: "comments_disabled" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = createBlogCommentSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.message },
        { status: 400 },
      );
    }

    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );

    const post = await repositoryService.getBlogPost(parsed.data.postId);
    if (!post?.isPublished) {
      return Response.json(
        { success: false, error: "post_not_found" },
        { status: 404 },
      );
    }

    const status = config.commentsPremoderation ? "pending" : "approved";
    const comment = await repositoryService.createComment(parsed.data, status);

    await this.emitBlogEvent(
      BLOG_COMMENT_CREATED_EVENT_TYPE,
      {
        appId: appData._id,
        status,
        comment: {
          _id: comment._id,
          postId: comment.postId,
          authorName: comment.authorName,
          authorEmail: comment.authorEmail,
          body: comment.body,
        },
        post: {
          _id: post._id,
          title: post.title,
          slug: post.slug,
        },
      },
      { actor: "visitor", actorName: comment.authorName },
    );

    logger.info({ postId: parsed.data.postId, status }, "Blog comment created");

    return Response.json({
      success: true,
      pending: status === "pending",
    });
  }

  private async processGetBlogCommentsAppCall(
    appData: ConnectedAppData<BlogConfiguration>,
    request: ApiRequest,
  ): Promise<ApiResponse> {
    const config = this.getBlogConfiguration(appData);

    if (!config.commentsEnabled) {
      return Response.json({ success: true, items: [], total: 0 });
    }

    const url = new URL(request.url);
    const parsed = getPublicBlogCommentsQuerySchema.safeParse({
      postId: url.searchParams.get("postId"),
      sort: url.searchParams.get("sort") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.message },
        { status: 400 },
      );
    }

    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );

    const result = await repositoryService.getApprovedComments(parsed.data);

    return Response.json({
      success: true,
      items: result.items,
      total: result.total,
    });
  }

  protected getRepositoryService(appId: string, organizationId: string) {
    return new BlogRepositoryService(
      appId,
      organizationId,
      this.props.getDbConnection,
      this.props.services,
    );
  }

  private adminEventSource(memberId?: string): EventSource {
    return memberId
      ? { actor: "member", actorId: memberId }
      : { actor: "member" };
  }

  private async emitBlogEvent(
    type: string,
    payload: unknown,
    source: EventSource,
  ) {
    const logger = this.loggerFactory("emitBlogEvent");
    try {
      logger.debug({ type, source }, "Emitting blog event");
      await this.props.services.eventService.emit(type, payload, source);
      logger.debug({ type, source }, "Blog event emitted");
    } catch (error: unknown) {
      logger.error(
        {
          type,
          source,
          error: error instanceof Error ? error.message : String(error),
        },
        "Failed to emit blog event",
      );
    }
  }

  private async processGetBlogPostsRequest(
    appData: ConnectedAppData,
    data: GetBlogPostsAction,
  ) {
    const logger = this.loggerFactory("processGetBlogPostsRequest");
    logger.debug({ appId: appData._id }, "Processing get blog posts request");

    try {
      const repositoryService = this.getRepositoryService(
        appData._id,
        appData.organizationId,
      );

      const result = await repositoryService.getBlogPosts(data.query);

      logger.debug({ appId: appData._id }, "Successfully retrieved blog posts");
      return result;
    } catch (error: any) {
      logger.error(
        { appId: appData._id, error },
        "Error retrieving blog posts",
      );
      throw error;
    }
  }

  private async processGetBlogPostRequest(
    appData: ConnectedAppData,
    data: GetBlogPostAction,
  ) {
    const logger = this.loggerFactory("processGetBlogPostRequest");
    logger.debug({ appId: appData._id }, "Processing get blog post request");

    try {
      const repositoryService = this.getRepositoryService(
        appData._id,
        appData.organizationId,
      );
      const result = await repositoryService.getBlogPost(data.id, data.slug);

      logger.debug({ appId: appData._id }, "Successfully retrieved blog post");
      return result;
    } catch (error: any) {
      logger.error({ appId: appData._id, error }, "Error retrieving blog post");
      throw error;
    }
  }

  private async processCreateBlogPostRequest(
    appData: ConnectedAppData,
    data: CreateBlogPostAction,
    memberId?: string,
  ) {
    const logger = this.loggerFactory("processCreateBlogPostRequest");
    logger.debug({ appId: appData._id }, "Processing create blog post request");

    try {
      const repositoryService = this.getRepositoryService(
        appData._id,
        appData.organizationId,
      );

      const isUnique = await repositoryService.checkBlogPostSlugUnique(
        data.post.slug,
      );
      if (!isUnique) {
        throw new ConnectedAppRequestError(
          "blog_post_slug_not_unique",
          { slug: data.post.slug },
          400,
          "Blog post slug not unique",
        );
      }

      const result = await repositoryService.createBlogPost(data.post);

      await this.emitBlogEvent(
        BLOG_POST_CREATED_EVENT_TYPE,
        {
          post: {
            _id: result._id,
            title: result.title,
            slug: result.slug,
          },
        },
        this.adminEventSource(memberId),
      );

      logger.debug({ appId: appData._id }, "Successfully created blog post");
      return result;
    } catch (error: any) {
      logger.error({ appId: appData._id, error }, "Error creating blog post");
      throw error;
    }
  }

  private async processUpdateBlogPostRequest(
    appData: ConnectedAppData,
    data: UpdateBlogPostAction,
    memberId?: string,
  ) {
    const logger = this.loggerFactory("processUpdateBlogPostRequest");
    logger.debug({ appId: appData._id }, "Processing update blog post request");

    try {
      const repositoryService = this.getRepositoryService(
        appData._id,
        appData.organizationId,
      );

      const isUnique = await repositoryService.checkBlogPostSlugUnique(
        data.post.slug,
        data.id,
      );
      if (!isUnique) {
        throw new ConnectedAppRequestError(
          "blog_post_slug_not_unique",
          { slug: data.post.slug },
          400,
          "Blog post slug not unique",
        );
      }

      const result = await repositoryService.updateBlogPost(data.id, data.post);

      if (result) {
        await this.emitBlogEvent(
          BLOG_POST_UPDATED_EVENT_TYPE,
          {
            post: {
              _id: result._id,
              title: result.title,
              slug: result.slug,
            },
          },
          this.adminEventSource(memberId),
        );
      }

      logger.debug({ appId: appData._id }, "Successfully updated blog post");
      return result;
    } catch (error: any) {
      logger.error({ appId: appData._id, error }, "Error updating blog post");
      throw error;
    }
  }

  private async processDeleteBlogPostRequest(
    appData: ConnectedAppData,
    data: DeleteBlogPostAction,
    memberId?: string,
  ) {
    const logger = this.loggerFactory("processDeleteBlogPostRequest");
    logger.debug({ appId: appData._id }, "Processing delete blog post request");

    try {
      const repositoryService = this.getRepositoryService(
        appData._id,
        appData.organizationId,
      );

      const result = await repositoryService.deleteBlogPost(data.id);
      if (!result) {
        throw new ConnectedAppRequestError(
          "blog_post_not_found",
          { id: data.id },
          404,
          "Blog post not found",
        );
      }

      await this.emitBlogEvent(
        BLOG_POST_DELETED_EVENT_TYPE,
        { postId: data.id },
        this.adminEventSource(memberId),
      );

      logger.debug({ appId: appData._id }, "Successfully deleted blog post");
      return result;
    } catch (error: any) {
      logger.error({ appId: appData._id, error }, "Error deleting blog post");
      throw error;
    }
  }

  private async processDeleteBlogPostsRequest(
    appData: ConnectedAppData,
    data: DeleteSelectedBlogPostsAction,
    memberId?: string,
  ) {
    const logger = this.loggerFactory("processDeleteBlogPostsRequest");
    logger.debug(
      { appId: appData._id },
      "Processing delete blog posts request",
    );

    try {
      const repositoryService = this.getRepositoryService(
        appData._id,
        appData.organizationId,
      );

      const result = await repositoryService.deleteBlogPosts(data.ids);

      const source = this.adminEventSource(memberId);
      for (const postId of data.ids) {
        await this.emitBlogEvent(
          BLOG_POST_DELETED_EVENT_TYPE,
          { postId },
          source,
        );
      }

      logger.debug({ appId: appData._id }, "Successfully deleted blog posts");
      return result;
    } catch (error: any) {
      logger.error({ appId: appData._id, error }, "Error deleting blog posts");
      throw error;
    }
  }

  private async processGetBlogTagsRequest(
    appData: ConnectedAppData,
    data: GetBlogTagsAction,
  ) {
    const logger = this.loggerFactory("processGetBlogTagsRequest");
    logger.debug({ appId: appData._id }, "Processing get blog tags request");

    try {
      const repositoryService = this.getRepositoryService(
        appData._id,
        appData.organizationId,
      );

      const result = await repositoryService.getBlogTags(
        data.sortBy,
        data.sortOrder,
      );

      logger.debug({ appId: appData._id }, "Successfully retrieved blog tags");
      return result;
    } catch (error: any) {
      logger.error({ appId: appData._id, error }, "Error retrieving blog tags");
      throw error;
    }
  }

  private async processCheckBlogPostSlugUniqueRequest(
    appData: ConnectedAppData,
    data: CheckBlogPostSlugUniqueAction,
  ) {
    const logger = this.loggerFactory("processCheckBlogPostSlugUniqueRequest");
    logger.debug(
      { appId: appData._id, slug: data.slug, id: data.id },
      "Processing check blog post slug uniqueness request",
    );

    try {
      const repositoryService = this.getRepositoryService(
        appData._id,
        appData.organizationId,
      );

      const result = await repositoryService.checkBlogPostSlugUnique(
        data.slug,
        data.id,
      );

      logger.debug(
        { appId: appData._id, slug: data.slug, id: data.id, result },
        "Successfully checked blog post slug uniqueness",
      );
      return result;
    } catch (error: any) {
      logger.error(
        { appId: appData._id, slug: data.slug, error },
        "Error checking blog post slug uniqueness",
      );
      throw error;
    }
  }

  private async processGetBlogCommentsRequest(
    appData: ConnectedAppData,
    data: GetBlogCommentsAction,
  ) {
    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );
    return repositoryService.getBlogComments(data.query);
  }

  private async processApproveBlogCommentRequest(
    appData: ConnectedAppData,
    data: ApproveBlogCommentAction,
    memberId?: string,
  ) {
    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );
    const result = await repositoryService.updateCommentStatus(
      data.id,
      "approved",
    );
    if (!result) {
      throw new ConnectedAppRequestError(
        "blog_comment_not_found",
        { id: data.id },
        404,
        "Blog comment not found",
      );
    }
    await this.emitBlogEvent(
      BLOG_COMMENT_STATUS_CHANGED_EVENT_TYPE,
      {
        appId: appData._id,
        comment: {
          _id: result._id,
          postId: result.postId,
          authorName: result.authorName,
        },
        status: "approved",
      },
      this.adminEventSource(memberId),
    );
    return result;
  }

  private async processRejectBlogCommentRequest(
    appData: ConnectedAppData,
    data: RejectBlogCommentAction,
    memberId?: string,
  ) {
    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );
    const result = await repositoryService.updateCommentStatus(
      data.id,
      "rejected",
    );
    if (!result) {
      throw new ConnectedAppRequestError(
        "blog_comment_not_found",
        { id: data.id },
        404,
        "Blog comment not found",
      );
    }

    await this.emitBlogEvent(
      BLOG_COMMENT_STATUS_CHANGED_EVENT_TYPE,
      {
        appId: appData._id,
        comment: {
          _id: result._id,
          postId: result.postId,
          authorName: result.authorName,
        },
        status: "rejected",
      },
      this.adminEventSource(memberId),
    );

    return result;
  }

  private async processDeleteBlogCommentRequest(
    appData: ConnectedAppData,
    data: DeleteBlogCommentAction,
    memberId?: string,
  ) {
    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );

    const result = await repositoryService.deleteComment(data.id);
    if (!result) {
      throw new ConnectedAppRequestError(
        "blog_comment_not_found",
        { id: data.id },
        404,
        "Blog comment not found",
      );
    }

    await this.emitBlogEvent(
      BLOG_COMMENT_DELETED_EVENT_TYPE,
      {
        appId: appData._id,
        commentId: result._id,
        postId: result.postId,
      },
      this.adminEventSource(memberId),
    );

    return result;
  }

  private async processDeleteBlogCommentsRequest(
    appData: ConnectedAppData,
    data: DeleteSelectedBlogCommentsAction,
    memberId?: string,
  ) {
    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );

    const comments = await repositoryService.getBlogCommentsByIds(data.ids);
    const result = await repositoryService.deleteComments(data.ids);

    const source = this.adminEventSource(memberId);
    for (const comment of comments) {
      await this.emitBlogEvent(
        BLOG_COMMENT_DELETED_EVENT_TYPE,
        {
          appId: appData._id,
          commentId: comment._id,
          postId: comment.postId,
        },
        source,
      );
    }

    return result;
  }

  private async processApproveBlogCommentsRequest(
    appData: ConnectedAppData,
    data: ApproveSelectedBlogCommentsAction,
  ) {
    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );
    const result = await repositoryService.updateCommentsStatus(
      data.ids,
      "approved",
    );
    await this.publishPendingCommentsBadge(appData);
    return result;
  }

  private async processRejectBlogCommentsRequest(
    appData: ConnectedAppData,
    data: RejectSelectedBlogCommentsAction,
  ) {
    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );
    const result = await repositoryService.updateCommentsStatus(
      data.ids,
      "rejected",
    );
    await this.publishPendingCommentsBadge(appData);
    return result;
  }

  private async publishPendingCommentsBadge(appData: ConnectedAppData) {
    const badges = await getBlogPendingCommentsBadges(
      appData._id,
      appData.organizationId,
      this.props.getDbConnection,
      this.props.services,
    );

    await this.props.services.dashboardNotificationsService.publishNotification(
      {
        type: "blog-pending-comments",
        badges,
      },
    );
  }

  private async processSetConfigurationRequest(
    appData: ConnectedAppData,
    data: BlogConfiguration,
  ): Promise<ConnectedAppStatusWithText<BlogAdminNamespace, BlogAdminKeys>> {
    const logger = this.loggerFactory("processSetConfigurationRequest");
    logger.debug(
      { appId: appData._id },
      "Processing set configuration request",
    );

    try {
      // Validate configuration
      const validatedConfig = blogConfigurationSchema.parse(data);

      logger.debug(
        { appId: appData._id },
        "Configuration validated successfully, installing blog app...",
      );

      await this.install(appData);

      const status: ConnectedAppStatusWithText<
        BlogAdminNamespace,
        BlogAdminKeys
      > = {
        status: "connected",
        statusText:
          "app_blog_admin.statusText.successfully_set_up" satisfies BlogAdminAllKeys,
      };

      this.props.update({
        data: validatedConfig,
        ...status,
      });

      logger.info(
        { appId: appData._id, status: status.status },
        "Successfully configured blog",
      );

      return status;
    } catch (error: any) {
      logger.error(
        { appId: appData._id, error },
        "Error processing blog configuration",
      );

      this.props.update({
        status: "failed",
        statusText:
          "app_blog_admin.statusText.error_processing_configuration" satisfies BlogAdminAllKeys,
      });

      throw error;
    }
  }

  public async expandPlaceholderPageSitemapItems(
    appData: ConnectedAppData,
    websiteUrl: string,
    page: Page,
  ): Promise<SitemapUrlEntry[] | undefined> {
    return expandBlogPlaceholderPageSitemapItems(
      this.props,
      websiteUrl,
      page,
      appData,
    );
  }
}
