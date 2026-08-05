import { Toolbar } from "@hacado/ui";
import React from "react";
import { ToolbarBlockGroups } from "./toolbar-block-groups";
import { ToolbarBlockToolbarGroup } from "./toolbar-block-toolbar-group";
import { ToolbarErrorGroup } from "./toolbar-error-group";
import { ToolbarHistoryGroup } from "./toolbar-history-group";
import { ToolbarViewGroups, ViewType } from "./toolbar-view-groups";
import { ToolbarViewportGroup } from "./toolbar-viewport-group";

export type { ViewType };

type BuilderToolbarProps = {
  args?: Record<string, any>;
};

export const BuilderToolbar: React.FC<BuilderToolbarProps> = ({ args }) => {
  return (
    <div className="flex flex-col-reverse md:flex-row gap-2 justify-between items-start  w-full border-b border-secondary bg-background sticky top-0 z-[45] p-1">
      <Toolbar className="flex-1 has-[button]:flex-wrap">
        <ToolbarHistoryGroup />
        <ToolbarBlockGroups />
        <ToolbarBlockToolbarGroup />
      </Toolbar>
      {/* <div className="grow" /> */}
      <Toolbar className="has-[button]:flex-wrap">
        <ToolbarViewportGroup />
        <ToolbarErrorGroup />
        <ToolbarViewGroups args={args} />
      </Toolbar>
    </div>
  );
};
