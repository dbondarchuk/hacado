"use client";

import { ToolbarButton } from "@hacado/ui";
import { withRef } from "@udecode/cn";
import {
  useIndentTodoToolBarButton,
  useIndentTodoToolBarButtonState,
} from "@udecode/plate-indent-list/react";
import { ListTodoIcon } from "lucide-react";

export const IndentTodoToolbarButton = withRef<typeof ToolbarButton>(
  (rest, ref) => {
    const state = useIndentTodoToolBarButtonState({ nodeType: "todo" });
    const { props } = useIndentTodoToolBarButton(state);

    return (
      <ToolbarButton ref={ref} tooltip="Todo" {...props} {...rest}>
        <ListTodoIcon />
      </ToolbarButton>
    );
  },
);
