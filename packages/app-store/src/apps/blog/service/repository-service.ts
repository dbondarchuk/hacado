import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  IConnectedAppProps,
  Query,
  systemEventSource,
  WithTotal,
} from "@hacado/types";
import { escapeRegex } from "@hacado/utils";
import { ObjectId, type Document, type Filter, type Sort } from "mongodb";
import {
  BLOG_COMMENTS_COLLECTION_NAME,
  BlogComment,
  BlogCommentEntity,
  BlogCommentListItem,
  BlogCommentPublic,
  BlogCommentStatus,
  CreateBlogCommentModel,
  GetBlogCommentsQuery,
  GetPublicBlogCommentsQuery,
  toBlogCommentPublic,
} from "../models/blog-comment";
import {
  BlogPost,
  BlogPostEntity,
  BlogPostUpdateModel,
} from "../models/blog-post";
import { BLOG_PAGES } from "./pages";

export const BLOG_POSTS_COLLECTION_NAME = "blog-posts";
export { BLOG_COMMENTS_COLLECTION_NAME };

export class BlogRepositoryService {
  protected readonly loggerFactory: LoggerFactory;

  public constructor(
    protected readonly appId: string,
    protected readonly organizationId: string,
    protected readonly getDbConnection: IConnectedAppProps["getDbConnection"],
    protected readonly services: IConnectedAppProps["services"],
  ) {
    this.loggerFactory = getLoggerFactory(
      "BlogRepositoryService",
      this.organizationId,
    );
  }

  private commentCountsAggregationStages(): Document[] {
    return [
      {
        $lookup: {
          from: BLOG_COMMENTS_COLLECTION_NAME,
          let: { postId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$postId", "$$postId"] },
                organizationId: this.organizationId,
                appId: this.appId,
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                approved: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "approved"] }, 1, 0],
                  },
                },
              },
            },
          ],
          as: "_commentStats",
        },
      },
      {
        $addFields: {
          commentsCount: {
            $ifNull: [{ $arrayElemAt: ["$_commentStats.approved", 0] }, 0],
          },
          totalCommentsCount: {
            $ifNull: [{ $arrayElemAt: ["$_commentStats.total", 0] }, 0],
          },
        },
      },
      {
        $project: {
          _commentStats: 0,
        },
      },
    ];
  }

  public async createBlogPost(post: BlogPostUpdateModel): Promise<BlogPost> {
    const logger = this.loggerFactory("createBlogPost");
    logger.debug({ post }, "Creating blog post");

    const db = await this.getDbConnection();
    const blogPost = {
      ...post,
      _id: new ObjectId().toString(),
      appId: this.appId,
      createdAt: new Date(),
      updatedAt: new Date(),
      organizationId: this.organizationId,
    } satisfies BlogPostEntity;

    await db
      .collection<BlogPostEntity>(BLOG_POSTS_COLLECTION_NAME)
      .insertOne(blogPost);

    logger.debug({ blogPost }, "Blog post created");

    return blogPost as BlogPost;
  }

  public async updateBlogPost(
    id: string,
    post: BlogPostUpdateModel,
  ): Promise<BlogPost | null> {
    const logger = this.loggerFactory("updateBlogPost");
    logger.debug({ id, post }, "Updating blog post");

    const db = await this.getDbConnection();
    const { modifiedCount } = await db
      .collection<BlogPostEntity>(BLOG_POSTS_COLLECTION_NAME)
      .updateOne(
        { _id: id, organizationId: this.organizationId },
        {
          $set: {
            ...post,
            updatedAt: new Date(),
          },
        },
      );

    if (modifiedCount === 0) {
      logger.warn({ id }, "Blog post not found");
      return null;
    }

    const updatedPost = await this.getBlogPost(id);
    logger.debug({ id }, "Blog post updated");

    return updatedPost;
  }

  public async deleteBlogPost(id: string): Promise<boolean> {
    const logger = this.loggerFactory("deleteBlogPost");
    logger.debug({ id }, "Deleting blog post");

    const db = await this.getDbConnection();
    const { deletedCount } = await db
      .collection<BlogPostEntity>(BLOG_POSTS_COLLECTION_NAME)
      .deleteOne({ _id: id, organizationId: this.organizationId });

    if (deletedCount === 0) {
      logger.warn({ id }, "Blog post not found");
      return false;
    }

    await this.deleteCommentsByPostIds([id]);

    logger.debug({ id }, "Blog post deleted");
    return true;
  }

  public async deleteBlogPosts(ids: string[]): Promise<boolean> {
    const logger = this.loggerFactory("deleteBlogPosts");
    logger.debug({ ids }, "Deleting blog posts");

    const db = await this.getDbConnection();
    const { deletedCount } = await db
      .collection<BlogPostEntity>(BLOG_POSTS_COLLECTION_NAME)
      .deleteMany({
        _id: {
          $in: ids,
        },
        organizationId: this.organizationId,
      });

    if (deletedCount !== ids.length) {
      logger.warn(
        { expected: ids.length, actual: deletedCount },
        "Not all blog posts were removed",
      );
    } else {
      logger.debug({ ids }, "Blog post deleted");
    }

    await this.deleteCommentsByPostIds(ids);

    return true;
  }

  public async getBlogPosts(
    query: Query & {
      tag?: string;
      isPublished?: boolean;
    },
  ): Promise<WithTotal<BlogPost>> {
    const logger = this.loggerFactory("getBlogPosts");
    logger.debug({ query }, "Getting blog posts");

    const db = await this.getDbConnection();

    const sort: Sort = query.sort?.reduce(
      (prev, curr) => ({
        ...prev,
        [curr.id]: curr.desc ? -1 : 1,
      }),
      {},
    ) || { publicationDate: -1, createdAt: -1 };

    const $and: Filter<BlogPost>[] = [
      {
        organizationId: this.organizationId,
        appId: this.appId,
      },
    ];

    if (query.isPublished !== undefined) {
      $and.push({
        isPublished: query.isPublished,
      });
    }

    if (query.tag) {
      $and.push({
        tags: { $in: [query.tag] },
      });
    }

    if (query.search) {
      const $regex = new RegExp(escapeRegex(query.search), "i");
      $and.push({
        $or: [{ title: { $regex } }, { slug: { $regex } }],
      });
    }

    const filter: Filter<BlogPost> = $and.length > 0 ? { $and } : {};

    const [result] = await db
      .collection<BlogPost>(BLOG_POSTS_COLLECTION_NAME)
      .aggregate([
        {
          $match: filter,
        },
        {
          $sort: sort,
        },
        ...this.commentCountsAggregationStages(),
        {
          $facet: {
            paginatedResults:
              query.limit === 0
                ? undefined
                : [
                    ...(typeof query.offset !== "undefined"
                      ? [{ $skip: query.offset }]
                      : []),
                    ...(typeof query.limit !== "undefined"
                      ? [{ $limit: query.limit }]
                      : []),
                  ],
            totalCount: [
              {
                $count: "count",
              },
            ],
          },
        },
      ])
      .toArray();

    const response = {
      total: result.totalCount?.[0]?.count || 0,
      items: result.paginatedResults || [],
    };

    logger.info(
      {
        result: { total: response.total, count: response.items.length },
        query,
      },
      "Fetched blog posts",
    );

    return response;
  }

  public async getBlogPost(
    id?: string,
    slug?: string,
  ): Promise<BlogPost | null> {
    const logger = this.loggerFactory("getBlogPost");
    logger.debug({ id, slug }, "Getting blog post");

    if (!id && !slug) {
      logger.warn({ id, slug }, "Neither id nor slug provided");
      return null;
    }

    const db = await this.getDbConnection();
    const filter: Filter<BlogPost> = {
      organizationId: this.organizationId,
      appId: this.appId,
    };

    if (id) {
      filter._id = id;
    } else if (slug) {
      filter.slug = slug;
    }

    const [blogPost] = await db
      .collection<BlogPost>(BLOG_POSTS_COLLECTION_NAME)
      .aggregate<BlogPost>([
        { $match: filter },
        ...this.commentCountsAggregationStages(),
        { $limit: 1 },
      ])
      .toArray();

    if (!blogPost) {
      logger.warn({ id, slug }, "Blog post not found");
    } else {
      logger.debug({ id, slug, title: blogPost.title }, "Blog post found");
    }

    return blogPost ?? null;
  }

  public async getBlogTags(
    sortBy: "alphabetical" | "count" = "alphabetical",
    sortOrder: "asc" | "desc" = "asc",
  ): Promise<Array<{ tag: string; count: number }>> {
    const logger = this.loggerFactory("getBlogTags");
    logger.debug({ sortBy, sortOrder }, "Getting blog tags");

    const db = await this.getDbConnection();

    const result = await db
      .collection<BlogPost>(BLOG_POSTS_COLLECTION_NAME)
      .aggregate([
        {
          $match: {
            organizationId: this.organizationId,
            appId: this.appId,
            isPublished: true,
            tags: { $exists: true, $ne: [] },
          },
        },
        {
          $unwind: "$tags",
        },
        {
          $group: {
            _id: "$tags",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            tag: "$_id",
            count: 1,
            _id: 0,
          },
        },
        {
          $sort:
            sortBy === "alphabetical"
              ? { tag: sortOrder === "asc" ? 1 : -1 }
              : { count: sortOrder === "asc" ? 1 : -1 },
        },
      ])
      .toArray();

    logger.debug({ count: result.length }, "Blog tags retrieved");

    return result as Array<{ tag: string; count: number }>;
  }

  public async checkBlogPostSlugUnique(
    slug: string,
    id?: string,
  ): Promise<boolean> {
    const logger = this.loggerFactory("checkBlogPostSlugUnique");
    logger.debug({ slug, id }, "Checking blog post slug uniqueness");
    const filter: Filter<BlogPost> = {
      slug,
      organizationId: this.organizationId,
      appId: this.appId,
    };
    if (id) {
      filter._id = { $ne: id };
    }

    const db = await this.getDbConnection();
    const hasNext = await db
      .collection<BlogPost>(BLOG_POSTS_COLLECTION_NAME)
      .aggregate([{ $match: filter }])
      .hasNext();

    const result = !hasNext;

    logger.debug(
      { slug, id, result },
      "Blog post slug uniqueness check result",
    );
    return result;
  }

  public async createComment(
    comment: CreateBlogCommentModel,
    status: BlogCommentStatus,
  ): Promise<BlogComment> {
    const logger = this.loggerFactory("createComment");
    logger.debug({ comment, status }, "Creating blog comment");

    const db = await this.getDbConnection();
    const entity = {
      ...comment,
      status,
      _id: new ObjectId().toString(),
      appId: this.appId,
      organizationId: this.organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies BlogCommentEntity;

    await db
      .collection<BlogCommentEntity>(BLOG_COMMENTS_COLLECTION_NAME)
      .insertOne(entity);

    return entity as BlogComment;
  }

  public async getApprovedComments(
    query: GetPublicBlogCommentsQuery,
  ): Promise<WithTotal<BlogCommentPublic>> {
    const logger = this.loggerFactory("getApprovedComments");
    logger.debug({ query }, "Getting approved blog comments");

    const db = await this.getDbConnection();
    const sortDirection = query.sort === "oldest" ? 1 : -1;
    const limit = query.limit ?? 10;
    const page = query.page ?? 1;
    const offset = (page - 1) * limit;

    const filter: Filter<BlogComment> = {
      organizationId: this.organizationId,
      appId: this.appId,
      postId: query.postId,
      status: "approved",
    };

    const [comments, total] = await Promise.all([
      db
        .collection<BlogComment>(BLOG_COMMENTS_COLLECTION_NAME)
        .find(filter)
        .sort({ createdAt: sortDirection })
        .skip(offset)
        .limit(limit)
        .toArray(),
      db
        .collection<BlogComment>(BLOG_COMMENTS_COLLECTION_NAME)
        .countDocuments(filter),
    ]);

    return {
      items: comments.map(toBlogCommentPublic),
      total,
    };
  }

  public async getCommentCount(
    postId: string,
    status: BlogCommentStatus = "approved",
  ): Promise<number> {
    const db = await this.getDbConnection();
    return db
      .collection<BlogComment>(BLOG_COMMENTS_COLLECTION_NAME)
      .countDocuments({
        organizationId: this.organizationId,
        appId: this.appId,
        postId,
        status,
      });
  }

  public async getBlogComments(
    query: GetBlogCommentsQuery,
  ): Promise<WithTotal<BlogCommentListItem>> {
    const logger = this.loggerFactory("getBlogComments");
    logger.debug({ query }, "Getting blog comments");

    const db = await this.getDbConnection();

    const sort: Sort = query.sort?.reduce(
      (prev, curr) => ({
        ...prev,
        [curr.id]: curr.desc ? -1 : 1,
      }),
      {},
    ) || { createdAt: -1 };

    const $and: Filter<BlogComment>[] = [
      {
        organizationId: this.organizationId,
        appId: this.appId,
      },
    ];

    if (query.postId) {
      $and.push({
        postId: {
          $in: Array.isArray(query.postId) ? query.postId : [query.postId],
        },
      });
    }

    if (query.status) {
      $and.push({
        status: {
          $in: Array.isArray(query.status) ? query.status : [query.status],
        },
      });
    }

    if (query.range?.start || query.range?.end) {
      const createdAt: Record<string, Date> = {};
      if (query.range.start) {
        createdAt.$gte = query.range.start;
      }
      if (query.range.end) {
        createdAt.$lte = query.range.end;
      }
      $and.push({ createdAt });
    }

    if (query.search) {
      const $regex = new RegExp(escapeRegex(query.search), "i");
      $and.push({
        $or: [
          { authorName: { $regex } },
          { authorEmail: { $regex } },
          { body: { $regex } },
        ],
      });
    }

    const filter: Filter<BlogComment> = $and.length > 0 ? { $and } : {};

    const [result] = await db
      .collection<BlogComment>(BLOG_COMMENTS_COLLECTION_NAME)
      .aggregate([
        {
          $lookup: {
            from: BLOG_POSTS_COLLECTION_NAME,
            localField: "postId",
            foreignField: "_id",
            as: "posts",
          },
        },
        {
          $set: {
            postTitle: { $first: "$posts.title" },
          },
        },
        { $unset: "posts" },
        { $match: filter },
        { $sort: sort },
        {
          $facet: {
            paginatedResults:
              query.limit === 0
                ? undefined
                : [
                    ...(typeof query.offset !== "undefined"
                      ? [{ $skip: query.offset }]
                      : []),
                    ...(typeof query.limit !== "undefined"
                      ? [{ $limit: query.limit }]
                      : []),
                  ],
            totalCount: [{ $count: "count" }],
          },
        },
      ])
      .toArray();

    const response = {
      total: result.totalCount?.[0]?.count || 0,
      items: (result.paginatedResults || []) as BlogCommentListItem[],
    };

    logger.info(
      { total: response.total, count: response.items.length },
      "Fetched blog comments",
    );

    return response;
  }

  public async getPendingCommentsCount(): Promise<number> {
    const db = await this.getDbConnection();
    return db
      .collection<BlogComment>(BLOG_COMMENTS_COLLECTION_NAME)
      .countDocuments({
        organizationId: this.organizationId,
        appId: this.appId,
        status: "pending",
      });
  }

  public async getBlogCommentsByIds(ids: string[]): Promise<BlogComment[]> {
    const logger = this.loggerFactory("getBlogCommentsByIds");
    logger.debug({ ids }, "Getting blog comments by ids");

    if (ids.length === 0) {
      logger.warn({ ids }, "No ids provided");
      return [];
    }

    const db = await this.getDbConnection();
    const comments = await db
      .collection<BlogComment>(BLOG_COMMENTS_COLLECTION_NAME)
      .find({
        _id: { $in: ids },
        organizationId: this.organizationId,
        appId: this.appId,
      })
      .toArray();

    logger.debug({ ids, count: comments.length }, "Blog comments found");

    return comments as BlogComment[];
  }

  public async updateCommentStatus(
    id: string,
    status: BlogCommentStatus,
  ): Promise<BlogComment | null> {
    const logger = this.loggerFactory("updateCommentStatus");
    logger.debug({ id, status }, "Updating blog comment status");

    const db = await this.getDbConnection();
    const { modifiedCount } = await db
      .collection<BlogCommentEntity>(BLOG_COMMENTS_COLLECTION_NAME)
      .updateOne(
        { _id: id, organizationId: this.organizationId, appId: this.appId },
        { $set: { status, updatedAt: new Date() } },
      );

    if (modifiedCount === 0) {
      return null;
    }

    const updated = await db
      .collection<BlogComment>(BLOG_COMMENTS_COLLECTION_NAME)
      .findOne({
        _id: id,
        organizationId: this.organizationId,
        appId: this.appId,
      });
    return updated as BlogComment | null;
  }

  public async updateCommentsStatus(
    ids: string[],
    status: BlogCommentStatus,
  ): Promise<number> {
    const logger = this.loggerFactory("updateCommentsStatus");
    logger.debug({ ids, status }, "Updating blog comments status");

    if (ids.length === 0) {
      return 0;
    }

    const db = await this.getDbConnection();
    const { modifiedCount } = await db
      .collection<BlogCommentEntity>(BLOG_COMMENTS_COLLECTION_NAME)
      .updateMany(
        {
          _id: { $in: ids },
          organizationId: this.organizationId,
          appId: this.appId,
        },
        { $set: { status, updatedAt: new Date() } },
      );

    return modifiedCount;
  }

  public async deleteComment(id: string): Promise<BlogCommentEntity | null> {
    const logger = this.loggerFactory("deleteComment");
    logger.debug({ id }, "Deleting blog comment");

    const db = await this.getDbConnection();
    const result = await db
      .collection<BlogCommentEntity>(BLOG_COMMENTS_COLLECTION_NAME)
      .findOneAndDelete({
        _id: id,
        organizationId: this.organizationId,
        appId: this.appId,
      });

    if (!result) {
      logger.warn({ id }, "Blog comment not found");
      return null;
    }

    logger.debug({ id }, "Blog comment deleted");
    return result;
  }

  public async deleteComments(ids: string[]): Promise<boolean> {
    const logger = this.loggerFactory("deleteComments");
    logger.debug({ ids }, "Deleting blog comments");

    const db = await this.getDbConnection();
    const { deletedCount } = await db
      .collection<BlogCommentEntity>(BLOG_COMMENTS_COLLECTION_NAME)
      .deleteMany({
        _id: { $in: ids },
        organizationId: this.organizationId,
        appId: this.appId,
      });

    if (deletedCount !== ids.length) {
      logger.warn(
        { expected: ids.length, actual: deletedCount },
        "Not all blog comments were removed",
      );
    } else {
      logger.debug({ ids }, "Blog comments deleted");
    }

    return true;
  }

  public async deleteCommentsByPostIds(postIds: string[]): Promise<void> {
    if (postIds.length === 0) {
      return;
    }

    const db = await this.getDbConnection();
    await db.collection(BLOG_COMMENTS_COLLECTION_NAME).deleteMany({
      postId: { $in: postIds },
      organizationId: this.organizationId,
      appId: this.appId,
    });
  }

  public async installCommentsCollection(): Promise<void> {
    const logger = this.loggerFactory("installCommentsCollection");
    const db = await this.getDbConnection();

    const collections = await db
      .listCollections({ name: BLOG_COMMENTS_COLLECTION_NAME })
      .toArray();
    const collection =
      collections.length > 0
        ? db.collection(BLOG_COMMENTS_COLLECTION_NAME)
        : await db.createCollection(BLOG_COMMENTS_COLLECTION_NAME);

    const indexes = {
      organizationId_appId_postId_createdAt_1: {
        organizationId: 1,
        appId: 1,
        postId: 1,
        createdAt: -1,
      },
      organizationId_appId_status_createdAt_1: {
        organizationId: 1,
        appId: 1,
        status: 1,
        createdAt: -1,
      },
    };

    for (const [name, index] of Object.entries(indexes)) {
      if (await collection.indexExists(name)) {
        continue;
      }
      await collection.createIndex(index, { name });
      logger.debug({ name }, "Created blog comments index");
    }
  }

  public async install(): Promise<void> {
    const logger = this.loggerFactory("install");
    logger.debug("Installing blog app");

    const db = await this.getDbConnection();

    logger.debug("Creating blog posts collection");
    const collection = await db.createCollection(BLOG_POSTS_COLLECTION_NAME);
    logger.debug("Blog posts collection created");

    const indexes = {
      organizationId_appId_1: { organizationId: 1, appId: 1 },
      organizationId_appId_slug_1: { organizationId: 1, appId: 1, slug: 1 },
      organizationId_appId_isPublished_1: {
        organizationId: 1,
        appId: 1,
        isPublished: 1,
      },
      organizationId_appId_tags_1: { organizationId: 1, appId: 1, tags: 1 },
      organizationId_appId_createdAt_1: {
        organizationId: 1,
        appId: 1,
        createdAt: 1,
      },
      organizationId_appId_updatedAt_1: {
        organizationId: 1,
        appId: 1,
        updatedAt: 1,
      },
      organizationId_appId_publicationDate_1: {
        organizationId: 1,
        appId: 1,
        publicationDate: 1,
      },
    };

    for (const [name, index] of Object.entries(indexes)) {
      logger.debug(`Checking if index ${name} exists`);
      if (await collection.indexExists(name)) {
        logger.debug(`Index ${name} already exists`);
        continue;
      }

      logger.debug(`Creating index ${name}`);
      await collection.createIndex(index, { name });
    }

    logger.debug("Blog posts collection indexed. Creating blog pages");

    const header = await this.services.pagesService.getPageHeaders({
      limit: 1,
    });

    const footer = await this.services.pagesService.getPageFooters({
      limit: 1,
    });

    const headerId = header.items[0]?._id;
    const footerId = footer.items[0]?._id;

    logger.debug({ headerId, footerId }, "Using blog pages header and footer");

    const pages = BLOG_PAGES(this.appId, headerId, footerId);

    for (const page of pages) {
      logger.debug(`Creating blog page ${page.title} (${page.slug})`);
      const isUnique = await this.services.pagesService.checkUniqueSlug(
        page.slug,
      );
      if (!isUnique) {
        logger.warn(`Blog page ${page.title} (${page.slug}) already exists`);
        continue;
      }

      logger.debug(
        `Blog page ${page.title} (${page.slug}) is unique. Creating...`,
      );
      await this.services.pagesService.createPage(page, systemEventSource);
      logger.debug(`Blog page ${page.title} (${page.slug}) created`);
    }

    logger.debug("Blog pages created");

    await this.installCommentsCollection();

    logger.debug("Blog app installed");
  }
}
