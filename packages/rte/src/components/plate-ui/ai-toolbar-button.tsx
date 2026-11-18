"use client";

import { ToolbarButton } from "@hacado/ui/toolbar";
import { withRef } from "@udecode/cn";
import { AIChatPlugin } from "@udecode/plate-ai/react";
import { useEditorPlugin } from "@udecode/plate/react";
import type { MouseEvent } from "react";

export const AIToolbarButton = withRef<typeof ToolbarButton>(
  ({ children, ...rest }, ref) => {
    const { api } = useEditorPlugin(AIChatPlugin);

    return (
      <ToolbarButton
        ref={ref}
        {...rest}
        onClick={() => {
          api.aiChat.show();
        }}
        onMouseDown={(e: MouseEvent<HTMLButtonElement>) => {
          e.preventDefault();
        }}
      >
        {children}
      </ToolbarButton>
    );
  },
);
