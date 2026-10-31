"use client";

import { ToolbarButton } from "@hacado/ui/toolbar";
import { withRef } from "@udecode/cn";
import {
  useMarkToolbarButton,
  useMarkToolbarButtonState,
} from "@udecode/plate/react";

export const MarkToolbarButton = withRef<
  typeof ToolbarButton,
  {
    nodeType: string;
    clear?: string[] | string;
  }
>(({ clear, nodeType, ...rest }, ref) => {
  const state = useMarkToolbarButtonState({ clear, nodeType });
  const { props } = useMarkToolbarButton(state);

  return <ToolbarButton ref={ref} {...props} {...rest} />;
});
