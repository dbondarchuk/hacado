import { cn } from "@hacado/ui/cn";
import { ScrollArea, ScrollBar } from "@hacado/ui/scroll-area";
import { Toolbar } from "@hacado/ui/toolbar";
import React from "react";
import { ToolbarBlockGroups } from "./toolbar-block-groups";
import { ToolbarBlockToolbarGroup } from "./toolbar-block-toolbar-group";
import {
  ToolbarButtonInjection,
  ToolbarButtonsProvider,
} from "./toolbar-buttons";
import { ToolbarErrorGroup } from "./toolbar-error-group";
import { ToolbarHistoryGroup } from "./toolbar-history-group";
import { ToolbarViewGroups, ViewType } from "./toolbar-view-groups";
import { ToolbarViewportGroup } from "./toolbar-viewport-group";

export type { ToolbarButtonInjection, ToolbarSection } from "./toolbar-buttons";
export type { ViewType };

type BuilderToolbarProps = {
  args?: Record<string, any>;
  toolbarButtons?: ToolbarButtonInjection[];
};

export const BuilderToolbar: React.FC<BuilderToolbarProps> = ({
  args,
  toolbarButtons,
}) => {
  return (
    <ToolbarButtonsProvider buttons={toolbarButtons}>
      <ScrollArea
        className={cn(
          "sticky top-0 z-[45] h-auto min-w-0 shrink-0 border-b border-secondary bg-background [&>[data-radix-scroll-area-viewport]]:h-auto [&>[data-radix-scroll-area-viewport]>div]:!block",
          "[[data-page-shell]_&]:-mx-4 md:[[data-page-shell]_&]:-mx-6",
        )}
      >
        <div
          className={cn(
            "flex w-max items-start gap-2 p-1 md:w-full md:justify-between",
            "[[data-page-shell]_&]:px-4 md:[[data-page-shell]_&]:px-6",
          )}
        >
          <Toolbar className="shrink-0 flex-nowrap md:min-w-0 md:shrink md:flex-1 md:has-[button]:flex-wrap">
            <ToolbarHistoryGroup />
            <ToolbarBlockGroups />
            <ToolbarBlockToolbarGroup />
          </Toolbar>
          <Toolbar className="shrink-0 flex-nowrap md:shrink md:has-[button]:flex-wrap">
            <ToolbarViewportGroup />
            <ToolbarErrorGroup />
            <ToolbarViewGroups args={args} />
          </Toolbar>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </ToolbarButtonsProvider>
  );
};
