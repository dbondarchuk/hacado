"use client";

import { useI18n } from "@hacado/i18n/client";
import { AutoSkeleton } from "@hacado/ui";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getBlogPost } from "../actions";
import { BlogPostForm } from "../form";
import { BlogPost } from "../models";
import {
  BlogAdminKeys,
  BlogAdminNamespace,
  blogAdminNamespace,
} from "../translations/types";

export const BlogEditPage = ({ appId }: { appId: string }) => {
  const params = useSearchParams();
  const postId = params.get("id") as string;
  const t = useI18n<BlogAdminNamespace, BlogAdminKeys>(blogAdminNamespace);

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await getBlogPost(appId, postId);
        setPost(data);
      } catch (error) {
        console.error("Error fetching blog post:", error);
      } finally {
        setLoading(false);
      }
    };

    if (appId && postId) {
      fetchPost();
    }
  }, [appId, postId]);

  if (loading) {
    return (
      <AutoSkeleton loading>
        <BlogPostForm appId={appId} />
      </AutoSkeleton>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">{t("app.pages.edit.notFound")}</p>
      </div>
    );
  }

  return <BlogPostForm initialData={post} appId={appId} />;
};
