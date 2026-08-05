"use client";

import { useI18n } from "@hacado/i18n/client";
import { Skeleton, toastPromise } from "@hacado/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { rejectBlogComment } from "../../actions";
import {
  BlogAdminKeys,
  BlogAdminNamespace,
  blogAdminNamespace,
} from "../../translations/types";

export const BlogCommentRejectPage: React.FC<{ appId: string }> = ({
  appId,
}) => {
  const searchParams = useSearchParams();
  const id = searchParams?.get("id");
  const router = useRouter();
  const t = useI18n<BlogAdminNamespace, BlogAdminKeys>(blogAdminNamespace);

  useEffect(() => {
    if (!id) {
      router.replace("/dashboard/blog/comments");
      return;
    }

    const fn = async () => {
      try {
        const comment = await toastPromise(rejectBlogComment(appId, id), {
          success: (data) =>
            t("comments.table.toast.rejected", { authorName: data.authorName }),
          error: t("comments.table.toast.error"),
        });

        router.replace(`/dashboard/blog/comments?postId=${comment?.postId}`);
      } catch (error: unknown) {
        console.error(error);
        router.replace("/dashboard/blog/comments");
      }
    };

    fn();
  }, [appId, id, router]);

  return <Skeleton className="w-full h-[70vh]" />;
};
