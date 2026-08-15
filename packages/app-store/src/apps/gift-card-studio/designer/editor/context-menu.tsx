"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@hacado/ui";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Layers,
  Scissors,
  Trash2,
} from "lucide-react";
import {
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
  giftCardStudioAdminNamespace,
} from "../../translations/types";
import { useEditorStore } from "../lib/store";

interface EditorContextMenuProps {
  children: React.ReactNode;
  elementId?: string;
  allowGrouping?: boolean;
}

export function EditorContextMenu({
  children,
  elementId,
  allowGrouping = true,
}: EditorContextMenuProps) {
  const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
    giftCardStudioAdminNamespace,
  );
  const {
    design,
    selectedElements,
    deleteElement,
    copyElement,
    pasteElement,
    groupElements,
    ungroupElements,
    bringToFront,
    sendToBack,
    selectElement,
  } = useEditorStore();

  const element = elementId
    ? design.elements.find((el) => el.id === elementId)
    : null;
  const isGroup = element?.type === "group";

  const handleContextMenu = (e: React.MouseEvent) => {
    // If right-clicking an element that's part of selection, keep selection
    if (elementId && selectedElements.includes(elementId)) {
      e.stopPropagation();
    }
    // If right-clicking an unselected element, select it
    else if (elementId) {
      selectElement(elementId);
    }
  };

  const handleCopy = () => {
    if (elementId) {
      copyElement(elementId);
    }
  };

  const handlePaste = () => {
    pasteElement();
  };

  const handleDelete = () => {
    if (elementId) {
      const el = design.elements.find((e) => e.id === elementId);
      if (el && !(el as any).required) {
        deleteElement(elementId);
      }
    }
  };

  const handleGroup = () => {
    if (selectedElements.length > 1) {
      groupElements(selectedElements);
    }
  };

  const handleUngroup = () => {
    if (elementId && isGroup) {
      ungroupElements(elementId);
    }
  };

  const handleBringToFront = () => {
    if (elementId) {
      bringToFront(elementId);
    }
  };

  const handleSendToBack = () => {
    if (elementId) {
      sendToBack(elementId);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild onContextMenu={handleContextMenu}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {elementId ? (
          <>
            <ContextMenuItem onClick={handleCopy}>
              <Copy className="w-4 h-4 mr-2" />
              {t("designer.contextMenu.copy")}
            </ContextMenuItem>
            <ContextMenuItem
              onClick={handleDelete}
              disabled={element && (element as any).required}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t("designer.contextMenu.delete")}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={handleBringToFront}>
              <ArrowUp className="w-4 h-4 mr-2" />
              {t("designer.contextMenu.bringToFront")}
            </ContextMenuItem>
            <ContextMenuItem onClick={handleSendToBack}>
              <ArrowDown className="w-4 h-4 mr-2" />
              {t("designer.contextMenu.sendToBack")}
            </ContextMenuItem>
            {allowGrouping && (isGroup || selectedElements.length > 1) && (
              <>
                <ContextMenuSeparator />
                {isGroup ? (
                  <ContextMenuItem onClick={handleUngroup}>
                    <Scissors className="w-4 h-4 mr-2" />
                    {t("designer.contextMenu.ungroup")}
                  </ContextMenuItem>
                ) : selectedElements.length > 1 ? (
                  <ContextMenuItem onClick={handleGroup}>
                    <Layers className="w-4 h-4 mr-2" />
                    {t("designer.contextMenu.group")}
                  </ContextMenuItem>
                ) : null}
              </>
            )}
          </>
        ) : (
          <>
            <ContextMenuItem onClick={handlePaste}>
              <Copy className="w-4 h-4 mr-2" />
              {t("designer.contextMenu.paste")}
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
