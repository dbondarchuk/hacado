"use client";

import { Button, cn } from "@hacado/ui";
import {
  useCommentDeleteButton,
  useCommentEditButton,
} from "@udecode/plate-comments/react";
import { MoreHorizontal } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@hacado/ui";

export function CommentMoreDropdown() {
  const { props: editProps } = useCommentEditButton();
  const { props: deleteProps } = useCommentDeleteButton();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={cn("h-6 p-1 text-muted-foreground")}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuItem {...editProps}>Edit comment</DropdownMenuItem>
          <DropdownMenuItem {...deleteProps}>Delete comment</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
