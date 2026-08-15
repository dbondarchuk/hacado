"use client";

import { ToolbarButton } from "@hacado/ui";
import { insertInlineEquation } from "@udecode/plate-math";
import { useEditorRef, withRef } from "@udecode/plate/react";
import { RadicalIcon } from "lucide-react";

export const InlineEquationToolbarButton = withRef<typeof ToolbarButton>(
  (props, ref) => {
    const editor = useEditorRef();

    return (
      <ToolbarButton
        ref={ref}
        tooltip="Mark as equation"
        {...props}
        onClick={() => {
          insertInlineEquation(editor);
        }}
      >
        <RadicalIcon />
      </ToolbarButton>
    );
  },
);
