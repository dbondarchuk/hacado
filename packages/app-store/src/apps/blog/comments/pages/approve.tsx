"use client";

import { useI18n } from "@timelish/i18n/client";
import { Skeleton, toastPromise } from "@timelish/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { approveBlogComment } from "../../actions";
import {
  BlogAdminKeys,
  blogAdminNamespace,
  BlogAdminNamespace,
} from "../../translations/types";

export const BlogCommentApprovePage: React.FC<{ appId: string }> = ({
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
        const comment = await toastPromise(approveBlogComment(appId, id), {
          success: (data) =>
            t("comments.table.toast.approved", { authorName: data.authorName }),
          error: t("comments.table.toast.error"),
        });

        router.replace(`/dashboard/blog/comments?postId=${comment?.postId}`);
      } catch (error: unknown) {
        console.error(error);
        router.replace("/dashboard/blog/comments");
      }
    };

    fn();
  }, [appId, id, router, t]);

  return <Skeleton className="w-full h-[70vh]" />;
};
