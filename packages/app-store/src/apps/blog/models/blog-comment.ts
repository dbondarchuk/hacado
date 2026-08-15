import {
  dateRangeSchema,
  Prettify,
  querySchema,
  WithAppId,
  WithDatabaseId,
  WithOrganizationId,
  zNonEmptyString,
  zObjectId,
} from "@hacado/types";
import * as z from "zod";
import { BlogPublicAllKeys } from "../translations/types";

export const BLOG_COMMENTS_COLLECTION_NAME = "blog-comments";

export const blogCommentStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
]);

export type BlogCommentStatus = z.infer<typeof blogCommentStatusSchema>;

export const createBlogCommentSchema = z.object({
  postId: zObjectId(
    "app_blog_public.block.postCommentForm.validation.postId.required" satisfies BlogPublicAllKeys,
  ),
  authorName: zNonEmptyString(
    "app_blog_public.block.postCommentForm.validation.name.required" satisfies BlogPublicAllKeys,
    1,
    256,
    "app_blog_public.block.postCommentForm.validation.name.max" satisfies BlogPublicAllKeys,
  ),
  authorEmail: z
    .string(
      "app_blog_public.block.postCommentForm.validation.email.required" satisfies BlogPublicAllKeys,
    )
    .email(
      "app_blog_public.block.postCommentForm.validation.email.invalid" satisfies BlogPublicAllKeys,
    )
    .max(
      256,
      "app_blog_public.block.postCommentForm.validation.email.max" satisfies BlogPublicAllKeys,
    ),
  body: zNonEmptyString(
    "app_blog_public.block.postCommentForm.validation.body.required" satisfies BlogPublicAllKeys,
    1,
    2048,
    "app_blog_public.block.postCommentForm.validation.body.max" satisfies BlogPublicAllKeys,
  ),
});

export type CreateBlogCommentModel = z.infer<typeof createBlogCommentSchema>;

export type BlogCommentEntity = WithOrganizationId<
  WithDatabaseId<
    WithAppId<
      CreateBlogCommentModel & {
        status: BlogCommentStatus;
        createdAt: Date;
        updatedAt: Date;
      }
    >
  >
>;

export type BlogComment = Prettify<BlogCommentEntity>;

export type BlogCommentPublic = Pick<
  BlogComment,
  "_id" | "postId" | "authorName" | "body" | "createdAt"
>;

export const toBlogCommentPublic = (
  comment: BlogComment,
): BlogCommentPublic => ({
  _id: comment._id,
  postId: comment.postId,
  authorName: comment.authorName,
  body: comment.body,
  createdAt: comment.createdAt,
});

export type BlogCommentListItem = BlogComment & {
  postTitle?: string;
};

export const getBlogCommentsQuerySchema = querySchema.extend({
  postId: z.array(zObjectId()).or(zObjectId()).optional(),
  status: z
    .array(blogCommentStatusSchema)
    .or(blogCommentStatusSchema)
    .optional(),
  range: dateRangeSchema.optional(),
});

export type GetBlogCommentsQuery = z.infer<typeof getBlogCommentsQuerySchema>;

export const getPublicBlogCommentsQuerySchema = z.object({
  postId: zObjectId(),
  sort: z.enum(["newest", "oldest"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type GetPublicBlogCommentsQuery = z.infer<
  typeof getPublicBlogCommentsQuerySchema
>;
