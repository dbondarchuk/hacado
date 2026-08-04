"use client";

import { useI18n } from "@timelish/i18n/client";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  useWebsiteUrl,
} from "@timelish/ui";
import {
  Circle,
  ImageIcon,
  Minus,
  Smile,
  Sparkles,
  Square,
  Type,
} from "lucide-react";
import {
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
  giftCardStudioAdminNamespace,
} from "../../translations/types";
import { useEditorStore } from "../lib/store";
import type {
  FieldKey,
  IconElement,
  ImageElement,
  ShapeElement,
  TextElement,
} from "../lib/types";
import { DYNAMIC_FIELDS } from "../lib/types";

export function Sidebar() {
  const { addElement } = useEditorStore();
  const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
    giftCardStudioAdminNamespace,
  );

  const websiteUrl = useWebsiteUrl();

  const addTextElement = () => {
    const element: TextElement = {
      id: `element-${Date.now()}`,
      type: "text",
      content: t("designer.newTextDefault"),
      position: { x: 100, y: 100 },
      size: { width: 200, height: 50 },
      rotation: 0,
      opacity: 1,
      visible: true,
      styles: {
        fontSize: 16,
        fontWeight: 400,
        color: "#000000",
        textAlign: "left",
        fontFamily: "Roboto",
      },
    };
    addElement(element);
  };

  const addDynamicField = (
    fieldKey: string,
    label: string,
    required = false,
  ) => {
    const element: TextElement = {
      id: `element-${Date.now()}`,
      type: "text",
      content: label,
      fieldKey,
      required,
      position: { x: 100, y: 100 },
      size: { width: 250, height: 50 },
      rotation: 0,
      opacity: 1,
      visible: true,
      styles: {
        fontSize: 18,
        fontWeight: 600,
        color: "#000000",
        textAlign: "left",
        fontFamily: "Roboto",
      },
    };
    addElement(element);
  };

  const addImageElement = () => {
    const element: ImageElement = {
      id: `element-${Date.now()}`,
      type: "image",
      src: `${websiteUrl}/assets/placeholder/200x200.png`,
      position: { x: 100, y: 100 },
      size: { width: 200, height: 200 },
      rotation: 0,
      opacity: 1,
      visible: true,
      styles: {
        objectFit: "contain",
      },
    };
    addElement(element);
  };

  const addIconElement = () => {
    const element: IconElement = {
      id: `element-${Date.now()}`,
      type: "icon",
      icon: "star",
      position: { x: 100, y: 100 },
      size: { width: 64, height: 64 },
      rotation: 0,
      opacity: 1,
      visible: true,
      styles: {
        color: "#000000",
        strokeWidth: 1,
      },
    };
    addElement(element);
  };

  const addShape = (shapeType: "rectangle" | "circle" | "line") => {
    const element: ShapeElement = {
      id: `element-${Date.now()}`,
      type: "shape",
      shapeType,
      position: { x: 100, y: 100 },
      size:
        shapeType === "line"
          ? { width: 200, height: 2 }
          : { width: 100, height: 100 },
      rotation: 0,
      opacity: 1,
      visible: true,
      styles: {
        fill: shapeType === "line" ? undefined : "#cccccc",
        stroke: shapeType === "line" ? "#000000" : undefined,
        strokeWidth: 2,
        borderRadius: 0,
      },
    };
    addElement(element);
  };

  const dynamicFieldKeysLabels: Record<FieldKey, GiftCardStudioAdminKeys> = {
    amount: "designer.dynamicFields.amount",
    code: "designer.dynamicFields.code",
    expiresAt: "designer.dynamicFields.expiresAt",
    to: "designer.dynamicFields.to",
    from: "designer.dynamicFields.from",
    message: "designer.dynamicFields.message",
  };

  return (
    <div className="w-full min-w-0 bg-background flex flex-col p-3 sm:p-4 gap-3 sm:gap-4 overflow-auto">
      <div>
        <h2 className="text-sm font-semibold mb-3 text-foreground">
          {t("designer.sidebar.elements")}
        </h2>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 bg-transparent"
            onClick={addTextElement}
          >
            <Type className="w-4 h-4" />
            {t("designer.sidebar.addText")}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 bg-transparent"
            onClick={addImageElement}
          >
            <ImageIcon className="w-4 h-4" />
            {t("designer.sidebar.addImage")}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 bg-transparent"
            onClick={addIconElement}
          >
            <Smile className="w-4 h-4" />
            {t("designer.sidebar.addIcon")}
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3 text-foreground">
          {t("designer.sidebar.dynamicFields")}
        </h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 bg-transparent"
            >
              <Sparkles className="w-4 h-4" />
              {t("designer.sidebar.addDynamicField")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {DYNAMIC_FIELDS.map((fieldKey) => (
              <DropdownMenuItem
                key={fieldKey}
                onClick={() =>
                  addDynamicField(
                    fieldKey,
                    dynamicFieldKeysLabels[fieldKey],
                    fieldKey === "amount" || fieldKey === "code",
                  )
                }
              >
                {t(dynamicFieldKeysLabels[fieldKey])}{" "}
                {(fieldKey === "amount" || fieldKey === "code") &&
                  t("designer.sidebar.required")}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3 text-foreground">
          {t("designer.sidebar.shapes")}
        </h2>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 bg-transparent"
            onClick={() => addShape("rectangle")}
          >
            <Square className="w-4 h-4" />
            {t("designer.sidebar.rectangle")}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 bg-transparent"
            onClick={() => addShape("circle")}
          >
            <Circle className="w-4 h-4" />
            {t("designer.sidebar.circle")}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 bg-transparent"
            onClick={() => addShape("line")}
          >
            <Minus className="w-4 h-4" />
            {t("designer.sidebar.line")}
          </Button>
        </div>
      </div>
    </div>
  );
}
