"use client";

import {
  DndContext,
  DragOverEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { AllKeys, useI18n } from "@hacado/i18n/client";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  ScrollArea,
} from "@hacado/ui";
import { cva } from "class-variance-authority";
import { ChevronsUpDown, Plus } from "lucide-react";
import React from "react";

export type SortableProps = {
  title: string;
  ids: string[];
  onSort: (activeId: string, overId: string) => void;
  onAdd?: () => void;
  children: React.ReactNode | React.ReactNode[];
  disabled?: boolean;
  allCollapsed?: boolean;
  collapse?: () => void;
  className?: string;
  invalid?: boolean | { isInvalid: boolean; message?: string | AllKeys };
};

export function Sortable({
  children,
  title,
  ids,
  disabled,
  allCollapsed,
  collapse,
  onSort,
  onAdd,
  className,
  invalid,
}: SortableProps) {
  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));
  const t = useI18n();

  const variants = cva(
    "h-fit max-h-[75vh] max-w-full bg-card flex flex-col snap-center w-full",
    {
      variants: {
        dragging: {
          default: "border-2 border-transparent",
          over: "ring-2 opacity-30",
          overlay: "ring-2 ring-primary",
        },
      },
    },
  );

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    onSort(activeId.toString(), overId.toString());
  }

  const invalidMessageBase =
    typeof invalid === "object" ? invalid.message : undefined;

  const invalidMessage = invalidMessageBase
    ? t.has(invalidMessageBase as AllKeys)
      ? t(invalidMessageBase as AllKeys)
      : invalidMessageBase
    : undefined;

  const isInvalid = typeof invalid === "object" ? invalid.isInvalid : invalid;

  return (
    <Card className={variants({ className })}>
      <CardHeader className="border-b">
        <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center justify-between">
          <div
            className={cn(
              "flex flex-col gap-1 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground",
              isInvalid ? "text-destructive" : "",
            )}
          >
            <div>{title}</div>
            {invalidMessage && <div className="text-xs">{invalidMessage}</div>}
          </div>
          <div className="flex flex-row gap-2 items-center">
            {collapse && (
              <Button
                type="button"
                disabled={disabled}
                variant="ghost"
                onClick={collapse}
                size="icon"
                aria-label={allCollapsed ? "Expand all" : "Collapse all"}
              >
                <ChevronsUpDown />
              </Button>
            )}
            {onAdd ? (
              <Button
                type="button"
                disabled={disabled}
                variant="ghost"
                onClick={onAdd}
                size="icon"
                aria-label="Add a new item"
              >
                <Plus />
              </Button>
            ) : null}
          </div>
        </CardTitle>
      </CardHeader>
      <DndContext sensors={sensors} onDragOver={onDragOver}>
        <CardContent className="overflow-x-hidden p-2">
          <ScrollArea className="h-full">
            <SortableContext items={ids}>{children}</SortableContext>
          </ScrollArea>
        </CardContent>
      </DndContext>
    </Card>
  );
}
