"use client";

import { SortableContext } from "@dnd-kit/sortable";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ScrollArea,
} from "@hacado/ui";
import { cva } from "class-variance-authority";
import { ChevronsUpDown, Plus } from "lucide-react";
import React from "react";

export type NonSortableProps = {
  title: React.ReactNode;
  ids: string[];
  onAdd: () => void;
  children: React.ReactNode | React.ReactNode[];
  disabled?: boolean;
  disabledAdd?: boolean;
  allCollapsed?: boolean;
  collapse?: () => void;
  className?: string;
  addButtonText?: string;
};

export function NonSortable({
  children,
  title,
  ids,
  disabled,
  disabledAdd,
  allCollapsed,
  collapse,
  onAdd,
  className,
  addButtonText,
}: NonSortableProps) {
  const variants = cva(
    "h-fit max-h-[75vh] max-w-full bg-card flex flex-col flex-shrink-0 snap-center w-full",
  );

  return (
    <Card className={variants({ className })}>
      <CardHeader className="border-b">
        <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center justify-between">
          <span>{title}</span>
          <div className="flex flex-row gap-2 items-center">
            {collapse && (
              <Button
                type="button"
                disabled={disabled}
                variant="ghost"
                size="icon"
                onClick={collapse}
                aria-label={allCollapsed ? "Expand all" : "Collapse all"}
              >
                <ChevronsUpDown />
              </Button>
            )}
            <Button
              type="button"
              disabled={disabled || disabledAdd}
              variant="ghost"
              onClick={onAdd}
              aria-label={addButtonText ?? "Add a new item"}
            >
              <Plus /> {addButtonText}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-hidden p-2">
        <ScrollArea className="h-full">
          <SortableContext items={ids}>{children}</SortableContext>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
