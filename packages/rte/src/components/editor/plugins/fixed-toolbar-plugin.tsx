"use client";

import { createPlatePlugin } from "@udecode/plate/react";

import { FixedToolbar } from "../../plate-ui/fixed-toolbar";
import { FixedToolbarButtons } from "../../plate-ui/fixed-toolbar-buttons";

export const FixedToolbarPlugin = (options?: {
  isMarkdown?: boolean;
  overlay?: boolean;
}) =>
  createPlatePlugin({
    key: "fixed-toolbar",
    render: {
      beforeEditable: () => (
        <FixedToolbar overlay={options?.overlay}>
          <FixedToolbarButtons isMarkdown={options?.isMarkdown} />
        </FixedToolbar>
      ),
    },
  });
