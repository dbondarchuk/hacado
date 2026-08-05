"use client";

import { ToolbarButton } from "@hacado/ui";
import { useCommentAddButton } from "@udecode/plate-comments/react";
import { MessageSquarePlus } from "lucide-react";

export function CommentToolbarButton() {
  const { hidden, props } = useCommentAddButton();

  if (hidden) return null;

  return (
    <ToolbarButton tooltip="Comment (⌘+⇧+M)" {...props}>
      <MessageSquarePlus />
    </ToolbarButton>
  );
}
