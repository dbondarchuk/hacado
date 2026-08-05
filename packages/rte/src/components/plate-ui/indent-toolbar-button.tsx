"use client";

import { ToolbarButton } from "@hacado/ui";
import { withRef } from "@udecode/cn";
import { useIndentButton } from "@udecode/plate-indent/react";
import { Indent } from "lucide-react";

export const IndentToolbarButton = withRef<typeof ToolbarButton>(
  (rest, ref) => {
    const { props } = useIndentButton();

    return (
      <ToolbarButton ref={ref} tooltip="Indent" {...props} {...rest}>
        <Indent />
      </ToolbarButton>
    );
  },
);
