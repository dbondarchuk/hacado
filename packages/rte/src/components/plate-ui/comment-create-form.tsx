"use client";

import { buttonVariants } from "@hacado/ui/button";
import { cn } from "@hacado/ui/cn";
import { inputVariants } from "@hacado/ui/input";
import {
  CommentNewSubmitButton,
  CommentNewTextarea,
  CommentsPlugin,
} from "@udecode/plate-comments/react";
import { usePluginOption } from "@udecode/plate/react";

import { CommentAvatar } from "./comment-avatar";

export function CommentCreateForm() {
  const myUserId = usePluginOption(CommentsPlugin, "myUserId");

  return (
    <div className="flex w-full space-x-2">
      <CommentAvatar userId={myUserId} />

      <div className="flex grow flex-col items-end gap-2">
        <CommentNewTextarea className={inputVariants()} />

        <CommentNewSubmitButton
          className={cn(buttonVariants({ size: "sm" }), "w-[90px]")}
        >
          Comment
        </CommentNewSubmitButton>
      </div>
    </div>
  );
}
