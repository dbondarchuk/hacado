"use client";

import { useDraggable } from "@dnd-kit/react";
import { useI18n } from "@hacado/i18n/client";
import {
  cn,
  TooltipResponsive,
  TooltipResponsiveContent,
  TooltipResponsiveTrigger,
} from "@hacado/ui";
import { GripVertical, Layers } from "lucide-react";
import { memo, useMemo } from "react";
import { useTemplates } from "../../../documents/editor/context";
import type { TemplateDefinition } from "../../../documents/types";

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
};

export const DraggableBlockItem = memo(
  ({
    blockType,
    blockConfig,
    isTemplate,
    variant = "list",
  }: DraggableBlockItemProps) => {
    const templates = useTemplates();
    const t = useI18n();

    const templateBlock = useMemo(() => {
      if (!isTemplate) return null;
      const template = templates?.[blockType];
      if (template) {
        return template.getBlock(t);
      }
      return null;
    }, [blockType, templates, isTemplate, t]);

    const { isDragging, ref } = useDraggable({
      id: `template-${blockType}`,
      type: templateBlock?.type ?? blockType,
      feedback: "clone",
      data: {
        type: isTemplate ? "composite-template" : "block-template",
        blockType,
        blockConfig,
      },
    });

    const previewImage =
      blockConfig.previewImage ??
      (isTemplate
        ? (templates?.[blockType] as TemplateDefinition | undefined)
            ?.previewImage
        : undefined);

    if (variant === "card" && previewImage) {
      return (
        <div
          ref={ref}
          className={cn(
            "overflow-hidden rounded-lg border border-border bg-background cursor-grab active:cursor-grabbing transition-colors hover:border-primary/40 hover:bg-accent/50",
            isDragging ? "opacity-50" : "opacity-100",
          )}
        >
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            <img
              src={previewImage}
              alt=""
              className="h-full w-full object-cover"
              draggable={false}
            />
            <div className="absolute right-2 top-2 rounded bg-background/80 p-1 text-muted-foreground">
              <GripVertical className="size-3.5" />
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
                <Layers className="size-3 shrink-0 text-muted-foreground" />
              </TooltipResponsiveTrigger>
              <TooltipResponsiveContent>
                {t("builder.baseBuilder.blocks.panel.template")}
              </TooltipResponsiveContent>
            </TooltipResponsive>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border bg-background p-3 transition-colors hover:bg-accent hover:text-accent-foreground cursor-grab active:cursor-grabbing",
          isDragging ? "opacity-50" : "!opacity-100",
        )}
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
                  <Layers className="size-3" />
                </TooltipResponsiveTrigger>
                <TooltipResponsiveContent>
                  {t("builder.baseBuilder.blocks.panel.template")}
                </TooltipResponsiveContent>
              </TooltipResponsive>
            ) : null}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {t(blockConfig.category as any)}
          </div>
        </div>
        <div className="flex-shrink-0 text-muted-foreground">
          <GripVertical className="size-4" />
        </div>
      </div>
    );
  },
);

DraggableBlockItem.displayName = "DraggableBlockItem";
