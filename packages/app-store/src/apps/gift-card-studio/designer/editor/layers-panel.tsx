"use client";

import { useI18n } from "@timelish/i18n/client";
import { Button, cn } from "@timelish/ui";
import { Copy, Eye, EyeOff, Group, Lock, Trash2, Ungroup } from "lucide-react";
import {
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
  giftCardStudioAdminNamespace,
} from "../../translations/types";
import { useEditorStore } from "../lib/store";
import type { TextElement } from "../lib/types";

interface LayersPanelProps {
  allowGrouping?: boolean;
}

const shapeTypeLabels: Record<string, GiftCardStudioAdminKeys> = {
  rectangle: "designer.sidebar.rectangle",
  circle: "designer.sidebar.circle",
  line: "designer.sidebar.line",
};

export function LayersPanel({ allowGrouping = true }: LayersPanelProps = {}) {
  const {
    design,
    selectedElements,
    selectElement,
    toggleSelection,
    updateElement,
    deleteElement,
    duplicateElement,
    groupElements,
    ungroupElements,
  } = useEditorStore();
  const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
    giftCardStudioAdminNamespace,
  );

  const renderElement = (element: any, indent = 0) => {
    const isSelected = selectedElements.includes(element.id);
    const isRequired =
      element.type === "text" && (element as TextElement).required;
    const textElement =
      element.type === "text" ? (element as TextElement) : null;
    const isGroup = element.type === "group";

    const label =
      element.type === "text"
        ? textElement?.fieldKey
          ? `${t.has(`designer.dynamicFields.${textElement.fieldKey}` as GiftCardStudioAdminKeys) ? t(`designer.dynamicFields.${textElement.fieldKey}` as GiftCardStudioAdminKeys) : textElement.content} [${t("designer.layers.dynamic")}]`
          : textElement?.content || t("designer.layers.text")
        : element.type === "icon"
          ? t("designer.layers.icon")
          : element.type === "image"
            ? t("designer.layers.image")
            : element.type === "group"
              ? t("designer.layers.groupLabel")
              : element.shapeType && shapeTypeLabels[element.shapeType]
                ? t(shapeTypeLabels[element.shapeType])
                : t("designer.layers.shape");

    return (
      <div key={element.id}>
        <div
          className={cn(
            "flex items-center gap-2 p-2 rounded text-sm cursor-pointer hover:bg-accent group",
            isSelected && "bg-accent",
            isRequired && "border border-primary/30 bg-primary/5",
          )}
          style={{ paddingLeft: `${8 + indent * 16}px` }}
          onClick={(e) => {
            if (e.shiftKey || e.ctrlKey || e.metaKey) {
              toggleSelection(element.id);
            } else {
              selectElement(element.id);
            }
          }}
        >
          <span className="flex-1 truncate text-xs text-foreground">
            {label}
          </span>
          {isRequired && (
            <div className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-primary" />
              <span className="text-[10px] text-primary font-semibold">
                {t("designer.layers.req")}
              </span>
            </div>
          )}
          {allowGrouping && isGroup && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                ungroupElements(element.id);
              }}
            >
              <Ungroup className="w-3 h-3" />
            </Button>
          )}
          {!isRequired && !isGroup && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                duplicateElement(element.id);
              }}
            >
              <Copy className="w-3 h-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              updateElement(element.id, { visible: !element.visible });
            }}
          >
            {element.visible ? (
              <Eye className="w-3 h-3" />
            ) : (
              <EyeOff className="w-3 h-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              deleteElement(element.id);
            }}
            disabled={isRequired}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
        {isGroup &&
          element.children &&
          element.children.map((childId: string) => {
            const child = design.elements.find((el) => el.id === childId);
            if (!child) return null;
            return renderElement(child, indent + 1);
          })}
      </div>
    );
  };

  const topLevelElements = design.elements.filter((el) => {
    // Check if this element is a child of any group
    const isChild = design.elements.some(
      (parent) =>
        parent.type === "group" && (parent as any).children?.includes(el.id),
    );
    return !isChild;
  });

  return (
    <div className="flex-1 p-4 overflow-auto h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">
          {t("designer.layers.title")}
        </h2>
        {allowGrouping && selectedElements.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => groupElements(selectedElements)}
          >
            <Group className="w-3 h-3 mr-1" />
            {t("designer.layers.group")}
          </Button>
        )}
      </div>
      <div className="space-y-1">
        {design.elements.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("designer.layers.noElements")}
          </p>
        ) : (
          [...topLevelElements]
            .reverse()
            .map((element) => renderElement(element))
        )}
      </div>
    </div>
  );
}
