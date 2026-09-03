"use client";

import { useDraggable } from "@dnd-kit/react";
import { useI18n } from "@hacado/i18n/client";
import {
  cn,
  TooltipResponsive,
  TooltipResponsiveContent,
  TooltipResponsiveTrigger,
} from "@hacado/ui";
import { GripVertical, Layers, LayoutTemplate } from "lucide-react";
import { memo, useMemo } from "react";
import { useTemplates } from "../../../documents/editor/context";
import {
  isLayoutTemplate,
  isSectionTemplate,
  type TemplateDefinition,
} from "../../../documents/types";

export type DraggableBlockItemProps = {
  blockType: string;
  blockConfig: {
    displayName: string;
    icon: React.ReactNode;
    category: string;
    previewImage?: string;
  };
  isTemplate: boolean;
  variant?: "list" | "card";
  /** Layout templates apply on click instead of drag. */
  onApplyLayout?: () => void;
};

export const DraggableBlockItem = memo(
  ({
    blockType,
    blockConfig,
    isTemplate,
    variant = "list",
    onApplyLayout,
  }: DraggableBlockItemProps) => {
    const templates = useTemplates();
    const t = useI18n();

    const template = templates?.[blockType] as TemplateDefinition | undefined;
    const isLayout = Boolean(template && isLayoutTemplate(template));

    const templateBlock = useMemo(() => {
      if (!isTemplate || !template || !isSectionTemplate(template)) return null;
      return template.getBlock(t);
    }, [template, isTemplate, t]);

    const { isDragging, ref } = useDraggable({
      id: `template-${blockType}`,
      type: templateBlock?.type ?? blockType,
      feedback: "clone",
      disabled: isLayout,
      data: {
        type: isTemplate ? "composite-template" : "block-template",
        blockType,
        blockConfig,
      },
    });

    const previewImage =
      blockConfig.previewImage ??
      (isTemplate ? template?.previewImage : undefined);

    const cardClass = cn(
      "overflow-hidden rounded-lg border border-border bg-background transition-colors hover:border-primary/40 hover:bg-accent/50",
      isLayout ? "cursor-pointer" : "cursor-grab active:cursor-grabbing",
      isDragging ? "opacity-50" : "opacity-100",
    );

    const listClass = cn(
      "flex items-center gap-2 rounded-lg border border-border bg-background p-3 transition-colors hover:bg-accent hover:text-accent-foreground",
      isLayout ? "cursor-pointer" : "cursor-grab active:cursor-grabbing",
      isDragging ? "opacity-50" : "!opacity-100",
    );

    if (variant === "card" && previewImage) {
      return (
        <div
          ref={isLayout ? undefined : ref}
          role={isLayout ? "button" : undefined}
          tabIndex={isLayout ? 0 : undefined}
          onClick={isLayout ? onApplyLayout : undefined}
          onKeyDown={
            isLayout
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onApplyLayout?.();
                  }
                }
              : undefined
          }
          className={cardClass}
        >
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            <img
              src={previewImage}
              alt=""
              className="h-full w-full object-cover"
              draggable={false}
            />
            <div className="absolute right-2 top-2 rounded bg-background/80 p-1 text-muted-foreground">
              {isLayout ? (
                <LayoutTemplate className="size-3.5" />
              ) : (
                <GripVertical className="size-3.5" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {t(blockConfig.displayName as any)}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {t(blockConfig.category as any)}
              </p>
            </div>
            <TooltipResponsive>
              <TooltipResponsiveTrigger>
                {isLayout ? (
                  <LayoutTemplate className="size-3 shrink-0 text-muted-foreground" />
                ) : (
                  <Layers className="size-3 shrink-0 text-muted-foreground" />
                )}
              </TooltipResponsiveTrigger>
              <TooltipResponsiveContent>
                {t(
                  isLayout
                    ? "builder.baseBuilder.blocks.panel.layoutTemplate"
                    : "builder.baseBuilder.blocks.panel.template",
                )}
              </TooltipResponsiveContent>
            </TooltipResponsive>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={isLayout ? undefined : ref}
        role={isLayout ? "button" : undefined}
        tabIndex={isLayout ? 0 : undefined}
        onClick={isLayout ? onApplyLayout : undefined}
        onKeyDown={
          isLayout
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onApplyLayout?.();
                }
              }
            : undefined
        }
        className={listClass}
      >
        <div className="flex-shrink-0 text-muted-foreground">
          {blockConfig.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="inline-flex w-full items-center gap-2 text-sm font-medium">
            <span className="flex-1 truncate">
              {t(blockConfig.displayName as any)}
            </span>
            {isTemplate ? (
              <TooltipResponsive>
                <TooltipResponsiveTrigger>
                  {isLayout ? (
                    <LayoutTemplate className="size-3" />
                  ) : (
                    <Layers className="size-3" />
                  )}
                </TooltipResponsiveTrigger>
                <TooltipResponsiveContent>
                  {t(
                    isLayout
                      ? "builder.baseBuilder.blocks.panel.layoutTemplate"
                      : "builder.baseBuilder.blocks.panel.template",
                  )}
                </TooltipResponsiveContent>
              </TooltipResponsive>
            ) : null}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {t(blockConfig.category as any)}
          </div>
        </div>
        {!isLayout ? (
          <div className="flex-shrink-0 text-muted-foreground">
            <GripVertical className="size-4" />
          </div>
        ) : null}
      </div>
    );
  },
);

DraggableBlockItem.displayName = "DraggableBlockItem";
