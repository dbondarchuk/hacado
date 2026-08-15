import { adminApi } from "@hacado/api-sdk";
import { WithTotal } from "@hacado/types";
import {
  ApproveBlogCommentActionType,
  ApproveSelectedBlogCommentsActionType,
  BlogComment,
  BlogCommentListItem,
  BlogPost,
  BlogPostUpdateModel,
  CheckBlogPostSlugUniqueActionType,
  CreateBlogPostActionType,
  DeleteBlogCommentActionType,
  DeleteBlogPostActionType,
  DeleteSelectedBlogCommentsActionType,
  DeleteSelectedBlogPostsActionType,
  GetBlogCommentsActionType,
  GetBlogCommentsQuery,
  GetBlogPostActionType,
  GetBlogPostsActionType,
  RejectBlogCommentActionType,
  RejectSelectedBlogCommentsActionType,
  UpdateBlogPostActionType,
} from "./models";

const loggerFactory = (action: string) => ({
  debug: (data: any, message: string) => {
    console.debug(`[${action}] DEBUG:`, message, data);
  },
  info: (data: any, message: string) => {
    console.log(`[${action}] INFO:`, message, data);
  },
  error: (data: any, message: string) => {
    console.error(`[${action}] ERROR:`, message, data);
  },
});

export async function getBlogPosts(
  appId: string,
  query: Parameters<typeof adminApi.apps.processRequest>[1] extends {
    type: typeof GetBlogPostsActionType;
  }
    ? Parameters<typeof adminApi.apps.processRequest>[1]["query"]
    : never,
) {
  const logger = loggerFactory("getBlogPosts");
  logger.debug({ appId, query }, "Getting blog posts");

  try {
    const result = (await adminApi.apps.processRequest(appId, {
      type: GetBlogPostsActionType,
      query,
    })) as WithTotal<BlogPost>;

    logger.info(
      { appId, resultCount: result?.items?.length || 0 },
      "Successfully retrieved blog posts",
    );
    return result;
  } catch (error: any) {
    logger.error(
      { appId, error: error?.message || error?.toString() },
      "Error getting blog posts",
    );
    throw error;
  }
}

export async function getBlogPost(appId: string, id?: string, slug?: string) {
  const logger = loggerFactory("getBlogPost");
  logger.debug({ appId, id, slug }, "Getting blog post");

  try {
    const result = (await adminApi.apps.processRequest(appId, {
      type: GetBlogPostActionType,
      id,
      slug,
    })) as BlogPost;

    logger.info({ appId, id, slug }, "Successfully retrieved blog post");
    return result;
  } catch (error: any) {
    logger.error(
      { appId, error: error?.message || error?.toString() },
      "Error getting blog post",
    );
    throw error;
  }
}

export async function createBlogPost(appId: string, post: BlogPostUpdateModel) {
  const logger = loggerFactory("createBlogPost");
  logger.debug({ appId, post }, "Creating blog post");

  try {
    const result = (await adminApi.apps.processRequest(appId, {
      type: CreateBlogPostActionType,
      post,
    })) as BlogPost;

    logger.info({ appId }, "Successfully created blog post");
    return result;
  } catch (error: any) {
    logger.error(
      { appId, error: error?.message || error?.toString() },
      "Error creating blog post",
    );
    throw error;
  }
}

export async function updateBlogPost(
  appId: string,
  id: string,
  post: BlogPostUpdateModel,
) {
  const logger = loggerFactory("updateBlogPost");
  logger.debug({ appId, id, post }, "Updating blog post");

  try {
    const result = (await adminApi.apps.processRequest(appId, {
      type: UpdateBlogPostActionType,
      id,
      post,
    })) as BlogPost;

    logger.info({ appId, id }, "Successfully updated blog post");
    return result;
  } catch (error: any) {
    logger.error(
      { appId, error: error?.message || error?.toString() },
      "Error updating blog post",
    );
    throw error;
  }
}

export async function deleteBlogPost(appId: string, id: string) {
  const logger = loggerFactory("deleteBlogPost");
  logger.debug({ appId, id }, "Deleting blog post");

  try {
    const result = await adminApi.apps.processRequest(appId, {
      type: DeleteBlogPostActionType,
      id,
    });

    logger.info({ appId, id }, "Successfully deleted blog post");
    return result;
  } catch (error: any) {
    logger.error(
      { appId, error: error?.message || error?.toString() },
      "Error deleting blog post",
    );
    throw error;
  }
}

export async function deleteSelectedBlogPosts(appId: string, ids: string[]) {
  const logger = loggerFactory("deleteSelectedBlogPosts");
  logger.debug({ appId, ids }, "Deleting blog posts");

  try {
    const result = await adminApi.apps.processRequest(appId, {
      type: DeleteSelectedBlogPostsActionType,
      ids,
    });

    logger.info({ appId, ids }, "Successfully deleted blog posts");
    return result;
  } catch (error: any) {
    logger.error(
      { appId, error: error?.message || error?.toString() },
      "Error deleting blog posts",
    );
    throw error;
  }
}

export async function getBlogComments(
  appId: string,
  query: GetBlogCommentsQuery,
) {
  const logger = loggerFactory("getBlogComments");
  logger.debug({ appId, query }, "Getting blog comments");

  try {
    const result = (await adminApi.apps.processRequest(appId, {
      type: GetBlogCommentsActionType,
      query,
    })) as WithTotal<BlogCommentListItem>;

    logger.info(
      { appId, resultCount: result?.items?.length || 0 },
      "Successfully retrieved blog comments",
    );
    return result;
  } catch (error: any) {
    logger.error(
      { appId, error: error?.message || error?.toString() },
      "Error getting blog comments",
    );
    throw error;
  }
}

export async function approveBlogComment(appId: string, id: string) {
  const result = (await adminApi.apps.processRequest(appId, {
    type: ApproveBlogCommentActionType,
    id,
  })) as BlogComment;
  return result;
}

export async function rejectBlogComment(appId: string, id: string) {
  const result = (await adminApi.apps.processRequest(appId, {
    type: RejectBlogCommentActionType,
    id,
  })) as BlogComment;
  return result;
}

export async function deleteBlogComment(appId: string, id: string) {
  return (await adminApi.apps.processRequest(appId, {
    type: DeleteBlogCommentActionType,
    id,
  })) as BlogComment;
}

export async function deleteSelectedBlogComments(appId: string, ids: string[]) {
  return adminApi.apps.processRequest(appId, {
    type: DeleteSelectedBlogCommentsActionType,
    ids,
  });
}

export async function approveSelectedBlogComments(
  appId: string,
  ids: string[],
) {
  return adminApi.apps.processRequest(appId, {
    type: ApproveSelectedBlogCommentsActionType,
    ids,
  });
}

export async function rejectSelectedBlogComments(appId: string, ids: string[]) {
  return adminApi.apps.processRequest(appId, {
    type: RejectSelectedBlogCommentsActionType,
    ids,
  });
}

export async function checkBlogPostSlugUnique(
  appId: string,
  slug: string,
  id?: string,
) {
  const logger = loggerFactory("checkBlogPostSlugUnique");
  logger.debug({ appId, slug, id }, "Checking blog post slug uniqueness");

  try {
    const result = await adminApi.apps.processRequest(appId, {
      type: CheckBlogPostSlugUniqueActionType,
      slug,
      id,
    });

    logger.info(
      { appId, slug, id },
      "Successfully checked blog post slug uniqueness",
    );
    return result;
  } catch (error: any) {
    logger.error(
      { appId, error: error?.message || error?.toString() },
      "Error checking blog post slug uniqueness",
    );
    throw error;
  }
}
