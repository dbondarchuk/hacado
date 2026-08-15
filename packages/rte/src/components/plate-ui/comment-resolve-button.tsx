"use client";

import { buttonVariants, cn } from "@hacado/ui";
import {
  CommentResolveButton as CommentResolveButtonPrimitive,
  useComment,
} from "@udecode/plate-comments/react";
import { Check, RotateCcw } from "lucide-react";

export function CommentResolveButton() {
  const comment = useComment()!;

  return (
    <CommentResolveButtonPrimitive
      className={cn(
        buttonVariants({ variant: "ghost" }),
        "h-6 p-1 text-muted-foreground",
      )}
    >
      {comment.isResolved ? (
        <RotateCcw className="size-4" />
      ) : (
        <Check className="size-4" />
      )}
    </CommentResolveButtonPrimitive>
  );
}
