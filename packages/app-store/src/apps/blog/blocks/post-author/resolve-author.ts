import { BlogPost, BlogPostAuthor } from "../../models/blog-post";
import { getBlogAuthorMemberName } from "./get-blog-author-member-name";

export const resolveAuthorName = (
  author: BlogPostAuthor | undefined,
  membersById?: ReadonlyMap<string, string>,
): string | null => {
  if (!author) {
    return null;
  }

  if (author.type === "member") {
    return membersById?.get(author.memberId) ?? null;
  }

  return author.name.trim() || null;
};

export const resolveAuthorNameFromPost = (
  post: Pick<BlogPost, "author"> | null | undefined,
  membersById?: ReadonlyMap<string, string>,
): string | null => {
  return resolveAuthorName(post?.author, membersById);
};

export const resolveAuthorNameFromPostAsync = async (
  post: Pick<BlogPost, "author"> | null | undefined,
  organizationId: string,
): Promise<string | null> => {
  const author = post?.author;
  if (!author) {
    return null;
  }

  if (author.type === "member") {
    return getBlogAuthorMemberName(organizationId, author.memberId);
  }

  return author.name.trim() || null;
};
