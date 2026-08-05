"use client";

import { useI18n } from "@hacado/i18n/client";
import { AutoSkeleton } from "@hacado/ui";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getBlogPost } from "../actions";
import { BlogPostForm } from "../form";
import { BlogPostUpdateModel } from "../models";
import {
  BlogAdminKeys,
  BlogAdminNamespace,
  blogAdminNamespace,
} from "../translations/types";

export const BlogNewPage = ({ appId }: { appId: string }) => {
  const params = useSearchParams();
  const fromId = params.get("from") as string;
  const t = useI18n<BlogAdminNamespace, BlogAdminKeys>(blogAdminNamespace);

  const [post, setPost] = useState<BlogPostUpdateModel | undefined>(undefined);
  const [loading, setLoading] = useState(!!fromId);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const data = await getBlogPost(appId, fromId);
        const { _id: _, updatedAt: ___, ...postData } = data;

        setPost(postData);
      } catch (error) {
        console.error("Error fetching blog post:", error);
      } finally {
        setLoading(false);
      }
    };

    if (appId && fromId) {
      fetchPost();
    }
  }, [appId, fromId]);

  return (
    <AutoSkeleton loading={loading}>
      <BlogPostForm initialData={post} appId={appId} />
    </AutoSkeleton>
  );
};
