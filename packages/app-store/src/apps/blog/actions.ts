import { appsApi } from "@hacado/api-sdk/admin/apps";
import type { AskUserRequest } from "@hacado/types/ai";
import { WithTotal } from "@hacado/types/database";
import type { BlogAiRunResult } from "./ai/run";
import { normalizeBlogAiProposal, type BlogAiProposal } from "./ai/schema";
import {
  ApproveBlogCommentActionType,
  ApproveSelectedBlogCommentsActionType,
  BlogAiGenerateAction,
  BlogAiGenerateActionType,
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
  query: Parameters<typeof appsApi.processRequest>[1] extends {
    type: typeof GetBlogPostsActionType;
  }
    ? Parameters<typeof appsApi.processRequest>[1]["query"]
    : never,
) {
  const logger = loggerFactory("getBlogPosts");
  logger.debug({ appId, query }, "Getting blog posts");

  try {
    const result = (await appsApi.processRequest(appId, {
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
    const result = (await appsApi.processRequest(appId, {
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
    const result = (await appsApi.processRequest(appId, {
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
    const result = (await appsApi.processRequest(appId, {
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
    const result = await appsApi.processRequest(appId, {
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
    const result = await appsApi.processRequest(appId, {
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
    const result = (await appsApi.processRequest(appId, {
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
  const result = (await appsApi.processRequest(appId, {
    type: ApproveBlogCommentActionType,
    id,
  })) as BlogComment;

  return result;
}

export async function rejectBlogComment(appId: string, id: string) {
  const result = (await appsApi.processRequest(appId, {
    type: RejectBlogCommentActionType,
    id,
  })) as BlogComment;

  return result;
}

export async function deleteBlogComment(appId: string, id: string) {
  return (await appsApi.processRequest(appId, {
    type: DeleteBlogCommentActionType,
    id,
  })) as BlogComment;
}

export async function deleteSelectedBlogComments(appId: string, ids: string[]) {
  return appsApi.processRequest(appId, {
    type: DeleteSelectedBlogCommentsActionType,
    ids,
  });
}

export async function approveSelectedBlogComments(
  appId: string,
  ids: string[],
) {
  return appsApi.processRequest(appId, {
    type: ApproveSelectedBlogCommentsActionType,
    ids,
  });
}

export async function rejectSelectedBlogComments(appId: string, ids: string[]) {
  return appsApi.processRequest(appId, {
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
    const result = await appsApi.processRequest(appId, {
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

export async function generateBlogPostAi(
  appId: string,
  input: Omit<BlogAiGenerateAction, never>,
  options?: {
    signal?: AbortSignal;
    onEvent?: (event: string, data: unknown) => void;
  },
): Promise<BlogAiRunResult> {
  const logger = loggerFactory("generateBlogPostAi");
  logger.debug(
    { appId, actionId: input.actionId },
    "Generating blog post AI proposal",
  );

  try {
    const raw = await appsApi.processRequestStream(
      appId,
      {
        type: BlogAiGenerateActionType,
        ...input,
      },
      {
        signal: options?.signal,
        onEvent: options?.onEvent,
      },
    );

    const result = normalizeBlogAiRunResult(raw);

    logger.info(
      { appId, actionId: input.actionId, status: result.status },
      "Successfully finished blog post AI generate",
    );

    return result;
  } catch (error: any) {
    logger.error(
      { appId, error: error?.message || error?.toString() },
      "Error generating blog post AI proposal",
    );

    throw error;
  }
}

function normalizeBlogAiRunResult(value: unknown): BlogAiRunResult {
  if (
    value &&
    typeof value === "object" &&
    "status" in value &&
    (value as { status: string }).status === "waiting_for_user" &&
    "askUser" in value
  ) {
    const waiting = value as {
      askUser: AskUserRequest;
      text?: unknown;
    };

    return {
      status: "waiting_for_user",
      askUser: waiting.askUser,
      text: typeof waiting.text === "string" ? waiting.text : undefined,
    };
  }

  if (
    value &&
    typeof value === "object" &&
    "status" in value &&
    (value as { status: string }).status === "completed" &&
    "proposal" in value
  ) {
    return {
      status: "completed",
      proposal: normalizeBlogAiProposal(
        (value as { proposal: unknown }).proposal,
      ),
    };
  }

  // Backward-compatible: bare proposal object
  return {
    status: "completed",
    proposal: normalizeBlogAiProposal(value),
  };
}

export type { BlogAiProposal, BlogAiRunResult };
