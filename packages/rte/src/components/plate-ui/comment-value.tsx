"use client";

import { buttonVariants, cn, inputVariants } from "@hacado/ui";
import {
  CommentEditActions,
  CommentEditTextarea,
} from "@udecode/plate-comments/react";

export function CommentValue() {
  return (
    <div className="my-2 flex flex-col items-end gap-2">
      <CommentEditTextarea className={cn(inputVariants(), "min-h-[60px]")} />

      <div className="flex space-x-2">
        <CommentEditActions.CancelButton
          className={buttonVariants({ size: "xs", variant: "outline" })}
        >
          Cancel
        </CommentEditActions.CancelButton>

        <CommentEditActions.SaveButton
          className={buttonVariants({ size: "xs", variant: "default" })}
        >
          Save
        </CommentEditActions.SaveButton>
      </div>
    </div>
  );
}
