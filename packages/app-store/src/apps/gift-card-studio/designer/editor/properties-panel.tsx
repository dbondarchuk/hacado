"use client";

import { useI18n } from "@timelish/i18n/client";
import {
  Button,
  ComboboxAsync,
  type IComboboxItem,
  Icon,
  type IconName,
  iconNames,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
} from "@timelish/ui";
import { AssetSelectorInput } from "@timelish/ui-admin";
import { ArrowDown, ArrowUp, Lock, Unlock } from "lucide-react";
import { DateTime } from "luxon";
import {
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
  giftCardStudioAdminNamespace,
} from "../../translations/types";
import { fontFamilyCss, getFamilyFromStoredFont } from "../lib/fonts";
import { useEditorStore } from "../lib/store";
import type {
  IconElement,
  ImageElement,
  Paint,
  ShapeElement,
  TextElement,
} from "../lib/types";
import {
  DEFAULT_EXPIRES_AT_DATE_FORMAT,
  EXPIRES_AT_DATE_FORMATS,
} from "../lib/types";
import { FontSelect } from "./font-select";

function formatLucideIconLabel(iconName: string): string {
  return iconName
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function PropertiesPanel() {
  const { selectedElements, design, updateElement, bringToFront, sendToBack } =
    useEditorStore();
  const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
    giftCardStudioAdminNamespace,
  );

  const selectedElement =
    selectedElements.length === 1
      ? design.elements.find((el) => el.id === selectedElements[0])
      : null;

  // Show message when multiple elements are selected
  if (selectedElements.length > 1) {
    return (
      <div className="flex-1 border-b border-border p-4 overflow-auto h-full">
        <h2 className="text-sm font-semibold mb-4 text-foreground">
          {t("designer.properties.title")}
        </h2>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-sm text-muted-foreground text-center">
            {t("designer.properties.elementsSelected", {
              count: selectedElements.length,
            })}
          </p>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {t("designer.properties.singleElementHint")}
          </p>
        </div>
      </div>
    );
  }

  if (!selectedElement) {
    return (
      <div className="flex-1 border-b border-border p-4 overflow-auto h-full">
        <h2 className="text-sm font-semibold mb-4 text-foreground">
          {t("designer.properties.canvasBackground")}
        </h2>

        <div className="space-y-4">
          <div>
            <Label className="text-xs text-foreground">
              {t("designer.properties.backgroundType")}
            </Label>
            <Select
              value={design.canvas.background?.type || "transparent"}
              onValueChange={(
                value: "transparent" | "color" | "gradient" | "image",
              ) => {
                if (value === "transparent") {
                  useEditorStore
                    .getState()
                    .setCanvas({ background: undefined });
                  return;
                }
                const newBg: any = { type: value };
                if (value === "color") {
                  newBg.color = "#ffffff";
                } else if (value === "gradient") {
                  newBg.gradient = {
                    type: "linear",
                    colors: ["#ffffff", "#e0e0e0"],
                    angle: 0,
                  };
                } else if (value === "image") {
                  newBg.image = { src: "", fit: "cover", position: "center" };
                } else {
                  return;
                }
                useEditorStore.getState().setCanvas({ background: newBg });
              }}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transparent">
                  {t("designer.properties.transparent")}
                </SelectItem>
                <SelectItem value="color">
                  {t("designer.properties.solidColor")}
                </SelectItem>
                <SelectItem value="gradient">
                  {t("designer.properties.gradient")}
                </SelectItem>
                <SelectItem value="image">
                  {t("designer.properties.image")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {design.canvas.background?.type === "color" && (
            <div>
              <Label className="text-xs text-foreground">
                {t("designer.properties.backgroundColor")}
              </Label>
              <Input
                type="color"
                value={design.canvas.background?.color || "#ffffff"}
                onChange={(e) =>
                  useEditorStore.getState().setCanvas({
                    background: { type: "color", color: e.target.value },
                  })
                }
                className="h-8"
              />
            </div>
          )}

          {design.canvas.background?.type === "gradient" && (
            <>
              <div>
                <Label className="text-xs text-foreground">
                  {t("designer.properties.gradientType")}
                </Label>
                <Select
                  value={design.canvas.background?.gradient?.type || "linear"}
                  onValueChange={(value: "linear" | "radial") => {
                    const bg = design.canvas.background!;
                    const grad = bg.gradient!;
                    useEditorStore.getState().setCanvas({
                      background: {
                        type: "gradient",
                        gradient: { ...grad, type: value },
                      },
                    });
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">
                      {t("designer.properties.linear")}
                    </SelectItem>
                    <SelectItem value="radial">
                      {t("designer.properties.radial")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-foreground">
                  {t("designer.properties.color1")}
                </Label>
                <Input
                  type="color"
                  value={
                    design.canvas.background?.gradient?.colors[0] || "#ffffff"
                  }
                  onChange={(e) => {
                    const grad = design.canvas.background?.gradient;
                    const colors = [
                      ...(grad?.colors || ["#ffffff", "#000000"]),
                    ];
                    colors[0] = e.target.value;
                    useEditorStore.getState().setCanvas({
                      background: {
                        type: "gradient",
                        gradient: { ...grad!, colors },
                      },
                    });
                  }}
                  className="h-8"
                />
              </div>

              <div>
                <Label className="text-xs text-foreground">
                  {t("designer.properties.color2")}
                </Label>
                <Input
                  type="color"
                  value={
                    design.canvas.background?.gradient?.colors[1] || "#000000"
                  }
                  onChange={(e) => {
                    const grad = design.canvas.background?.gradient;
                    const colors = [
                      ...(grad?.colors || ["#ffffff", "#000000"]),
                    ];
                    colors[1] = e.target.value;
                    useEditorStore.getState().setCanvas({
                      background: {
                        type: "gradient",
                        gradient: { ...grad!, colors },
                      },
                    });
                  }}
                  className="h-8"
                />
              </div>

              {design.canvas.background?.gradient?.type === "linear" && (
                <div>
                  <Label className="text-xs mb-2 block text-foreground">
                    {t("designer.properties.angle")}
                  </Label>
                  <Slider
                    value={[design.canvas.background?.gradient?.angle ?? 0]}
                    onValueChange={([value]) => {
                      const grad = design.canvas.background?.gradient!;
                      useEditorStore.getState().setCanvas({
                        background: {
                          type: "gradient",
                          gradient: { ...grad, angle: value },
                        },
                      });
                    }}
                    max={360}
                    step={1}
                    className="mb-2"
                  />
                  <span className="text-xs text-muted-foreground">
                    {design.canvas.background?.gradient?.angle ?? 0}°
                  </span>
                </div>
              )}
            </>
          )}

          {design.canvas.background?.type === "image" && (
            <>
              <div>
                <Label className="text-xs text-foreground">
                  {t("designer.properties.imageUrl")}
                </Label>
                <AssetSelectorInput
                  value={design.canvas.background?.image?.src || ""}
                  placeholder={t("designer.properties.imageUrlPlaceholder")}
                  accept="image/*"
                  fullUrl={true}
                  h="md"
                  onChange={(value) => {
                    const img = design.canvas.background?.image;
                    useEditorStore.getState().setCanvas({
                      background: {
                        type: "image",
                        image: { ...img!, src: value },
                      },
                    });
                  }}
                />
              </div>

              <div>
                <Label className="text-xs text-foreground">
                  {t("designer.properties.imageFit")}
                </Label>
                <Select
                  value={design.canvas.background?.image?.fit || "cover"}
                  onValueChange={(
                    value: "cover" | "contain" | "fill" | "none",
                  ) => {
                    const img = design.canvas.background?.image!;
                    useEditorStore.getState().setCanvas({
                      background: {
                        type: "image",
                        image: { ...img, fit: value },
                      },
                    });
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cover">
                      {t("designer.properties.cover")}
                    </SelectItem>
                    <SelectItem value="contain">
                      {t("designer.properties.contain")}
                    </SelectItem>
                    <SelectItem value="fill">
                      {t("designer.properties.fill")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const renderTextProperties = (element: TextElement) => (
    <div className="space-y-4">
      {element.fieldKey && (
        <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-primary">
              {t("designer.properties.dynamicField")}
            </span>
            {element.required && <Lock className="w-3 h-3 text-primary" />}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("designer.properties.fieldLabel", { key: element.fieldKey })}
          </p>
        </div>
      )}

      {!element.fieldKey && (
        <div>
          <Label className="text-xs text-foreground">
            {t("designer.properties.content")}
          </Label>
          <Input
            value={element.content}
            onChange={(e) =>
              updateElement(element.id, { content: e.target.value })
            }
            className="h-8 text-sm"
            disabled={!!element.fieldKey}
          />
        </div>
      )}

      {element.fieldKey === "expiresAt" && (
        <div>
          <Label className="text-xs text-foreground">
            {t("designer.properties.dateFormat")}
          </Label>
          <Select
            value={element.dateFormat ?? DEFAULT_EXPIRES_AT_DATE_FORMAT}
            onValueChange={(value) =>
              updateElement(element.id, { dateFormat: value })
            }
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPIRES_AT_DATE_FORMATS.map((fmt) => (
                <SelectItem key={fmt} value={fmt}>
                  {DateTime.now().toFormat(fmt)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <FontSelect
        value={getFamilyFromStoredFont(element.styles.fontFamily)}
        onChange={(family) =>
          updateElement(element.id, {
            styles: { ...element.styles, fontFamily: fontFamilyCss(family) },
          })
        }
      />

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs text-foreground">
            {t("designer.properties.fontSize")}
          </Label>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() =>
              updateElement(element.id, {
                styles: {
                  ...element.styles,
                  fontSizeLocked: !element.styles.fontSizeLocked,
                },
              })
            }
          >
            {element.styles.fontSizeLocked ? (
              <Lock className="w-3 h-3" />
            ) : (
              <Unlock className="w-3 h-3" />
            )}
          </Button>
        </div>
        <Input
          type="number"
          value={element.styles.fontSize || 16}
          onChange={(e) =>
            updateElement(element.id, {
              styles: { ...element.styles, fontSize: Number(e.target.value) },
            })
          }
          className="h-8 text-sm"
        />
      </div>

      <div>
        <Label className="text-xs text-foreground">
          {t("designer.properties.fontWeight")}
        </Label>
        <Select
          value={String(element.styles.fontWeight || 400)}
          onValueChange={(value) =>
            updateElement(element.id, {
              styles: { ...element.styles, fontWeight: Number(value) },
            })
          }
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="300">
              {t("designer.properties.light")}
            </SelectItem>
            <SelectItem value="400">
              {t("designer.properties.regular")}
            </SelectItem>
            <SelectItem value="500">
              {t("designer.properties.medium")}
            </SelectItem>
            <SelectItem value="600">
              {t("designer.properties.semiBold")}
            </SelectItem>
            <SelectItem value="700">{t("designer.properties.bold")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs text-foreground">
          {t("designer.properties.textAlign")}
        </Label>
        <Select
          value={element.styles.textAlign || "left"}
          onValueChange={(value: any) =>
            updateElement(element.id, {
              styles: { ...element.styles, textAlign: value },
            })
          }
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">
              {t("designer.properties.left")}
            </SelectItem>
            <SelectItem value="center">
              {t("designer.properties.center")}
            </SelectItem>
            <SelectItem value="right">
              {t("designer.properties.right")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs text-foreground">
          {t("designer.properties.color")}
        </Label>
        <Input
          type="color"
          value={element.styles.color || "#000000"}
          onChange={(e) =>
            updateElement(element.id, {
              styles: { ...element.styles, color: e.target.value },
            })
          }
          className="h-8"
        />
      </div>
    </div>
  );

  /**
   * Generic paint editor. When `strokeOnly` is true the options are restricted
   * to "none" and "color" because CSS border does not support gradients/images.
   */
  const PaintEditor = ({
    label,
    paint,
    onChange,
    strokeOnly = false,
  }: {
    label: string;
    paint: Paint | undefined;
    onChange: (p: Paint | undefined) => void;
    strokeOnly?: boolean;
  }) => {
    const type = paint?.type ?? "none";
    return (
      <div className="space-y-2">
        <Label className="text-xs text-foreground">{label}</Label>
        <Select
          value={type}
          onValueChange={(v: Paint["type"]) => {
            if (v === "none") {
              onChange(undefined);
              return;
            }
            if (v === "color") onChange({ type: "color", color: "#cccccc" });
            else if (v === "gradient")
              onChange({
                type: "gradient",
                gradient: {
                  type: "linear",
                  colors: ["#cccccc", "#333333"],
                  angle: 0,
                },
              });
            else if (v === "image")
              onChange({ type: "image", image: { src: "", fit: "cover" } });
          }}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              {t("designer.properties.none")}
            </SelectItem>
            <SelectItem value="color">
              {t("designer.properties.solidColor")}
            </SelectItem>
            {!strokeOnly && (
              <SelectItem value="gradient">
                {t("designer.properties.gradient")}
              </SelectItem>
            )}
            {!strokeOnly && (
              <SelectItem value="image">
                {t("designer.properties.image")}
              </SelectItem>
            )}
          </SelectContent>
        </Select>

        {type === "color" && (
          <Input
            type="color"
            value={paint?.color || "#cccccc"}
            onChange={(e) => onChange({ type: "color", color: e.target.value })}
            className="h-8"
          />
        )}

        {type === "gradient" && !strokeOnly && paint?.gradient && (
          <div className="space-y-2 pl-2 border-l border-border">
            <Select
              value={paint.gradient.type}
              onValueChange={(v: "linear" | "radial") =>
                onChange({
                  ...paint,
                  gradient: { ...paint.gradient!, type: v },
                })
              }
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">
                  {t("designer.properties.linear")}
                </SelectItem>
                <SelectItem value="radial">
                  {t("designer.properties.radial")}
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input
                type="color"
                value={paint.gradient.colors[0]}
                onChange={(e) => {
                  const colors = [...paint.gradient!.colors];
                  colors[0] = e.target.value;
                  onChange({
                    ...paint,
                    gradient: { ...paint.gradient!, colors },
                  });
                }}
                className="h-8 flex-1"
              />
              <Input
                type="color"
                value={paint.gradient.colors[1] || "#000000"}
                onChange={(e) => {
                  const colors = [...paint.gradient!.colors];
                  colors[1] = e.target.value;
                  onChange({
                    ...paint,
                    gradient: { ...paint.gradient!, colors },
                  });
                }}
                className="h-8 flex-1"
              />
            </div>
            {paint.gradient.type === "linear" && (
              <div className="flex items-center gap-2">
                <Label className="text-xs text-foreground shrink-0">
                  {t("designer.properties.angle")}
                </Label>
                <Input
                  type="number"
                  value={paint.gradient.angle ?? 0}
                  onChange={(e) =>
                    onChange({
                      ...paint,
                      gradient: {
                        ...paint.gradient!,
                        angle: Number(e.target.value),
                      },
                    })
                  }
                  className="h-8 text-sm"
                />
              </div>
            )}
          </div>
        )}

        {type === "image" && !strokeOnly && paint?.image !== undefined && (
          <div className="space-y-2 pl-2 border-l border-border">
            <AssetSelectorInput
              value={paint.image?.src || ""}
              fullUrl
              accept="image/*"
              onChange={(value) =>
                onChange({
                  ...paint,
                  image: { ...(paint.image ?? { fit: "cover" }), src: value },
                })
              }
              className="h-8 text-sm"
              placeholder={t("designer.properties.imageUrlPlaceholder")}
            />
            <Select
              value={paint.image?.fit || "cover"}
              onValueChange={(v: "cover" | "contain" | "fill") =>
                onChange({
                  ...paint,
                  image: { ...(paint.image ?? { src: "" }), fit: v },
                })
              }
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">
                  {t("designer.properties.cover")}
                </SelectItem>
                <SelectItem value="contain">
                  {t("designer.properties.contain")}
                </SelectItem>
                <SelectItem value="fill">
                  {t("designer.properties.fill")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    );
  };

  const renderShapeProperties = (element: ShapeElement) => {
    const fillPaint: Paint | undefined =
      element.styles.fillPaint ??
      (element.styles.fill
        ? { type: "color", color: element.styles.fill }
        : undefined);
    const strokePaint: Paint | undefined =
      element.styles.strokePaint ??
      (element.styles.stroke
        ? { type: "color", color: element.styles.stroke }
        : undefined);

    const updateFill = (p: Paint | undefined) =>
      updateElement(element.id, {
        styles: {
          ...element.styles,
          fillPaint: p,
          fill: p?.type === "color" ? p.color : undefined,
        },
      });
    const updateStroke = (p: Paint | undefined) =>
      updateElement(element.id, {
        styles: {
          ...element.styles,
          strokePaint: p,
          stroke: p?.type === "color" ? p.color : undefined,
        },
      });

    return (
      <div className="space-y-4">
        <PaintEditor
          label={t("designer.properties.paintFill")}
          paint={fillPaint}
          onChange={updateFill}
        />

        {element.shapeType !== "line" && (
          <>
            <PaintEditor
              label={t("designer.properties.paintStroke")}
              paint={strokePaint}
              onChange={updateStroke}
              strokeOnly
            />
            <div>
              <Label className="text-xs text-foreground">
                {t("designer.properties.strokeWidth")}
              </Label>
              <Input
                type="number"
                value={element.styles.strokeWidth || 1}
                onChange={(e) =>
                  updateElement(element.id, {
                    styles: {
                      ...element.styles,
                      strokeWidth: Number(e.target.value),
                    },
                  })
                }
                className="h-8 text-sm"
              />
            </div>
          </>
        )}

        {element.shapeType === "rectangle" && (
          <div>
            <Label className="text-xs text-foreground">
              {t("designer.properties.borderRadius")}
            </Label>
            <Input
              type="number"
              value={element.styles.borderRadius || 0}
              onChange={(e) =>
                updateElement(element.id, {
                  styles: {
                    ...element.styles,
                    borderRadius: Number(e.target.value),
                  },
                })
              }
              className="h-8 text-sm"
            />
          </div>
        )}

        {element.shapeType === "line" && (
          <div>
            <Label className="text-xs text-foreground">
              {t("designer.properties.lineThickness")}
            </Label>
            <Input
              type="number"
              value={element.styles.strokeWidth || 2}
              onChange={(e) =>
                updateElement(element.id, {
                  styles: {
                    ...element.styles,
                    strokeWidth: Number(e.target.value),
                  },
                })
              }
              className="h-8 text-sm"
            />
          </div>
        )}
      </div>
    );
  };

  const renderImageProperties = (element: ImageElement) => (
    <div className="space-y-4">
      <div>
        <Label className="text-xs text-foreground">
          {t("designer.properties.imageUrl")}
        </Label>
        <AssetSelectorInput
          fullUrl
          accept="image/*"
          value={element.src || ""}
          onChange={(value) => updateElement(element.id, { src: value })}
          className="h-8 text-sm"
          placeholder={t("designer.properties.imageUrlPlaceholder")}
        />
      </div>

      <div>
        <Label className="text-xs text-foreground">
          {t("designer.properties.objectFit")}
        </Label>
        <Select
          value={element.styles.objectFit || "contain"}
          onValueChange={(value: any) =>
            updateElement(element.id, {
              styles: { ...element.styles, objectFit: value },
            })
          }
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="contain">
              {t("designer.properties.contain")}
            </SelectItem>
            <SelectItem value="cover">
              {t("designer.properties.cover")}
            </SelectItem>
            <SelectItem value="fill">
              {t("designer.properties.fill")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderIconProperties = (element: IconElement) => (
    <div className="space-y-4">
      <div>
        <Label className="text-xs text-foreground">
          {t("designer.properties.icon")}
        </Label>
        <ComboboxAsync
          id="gift-card-designer-icon"
          fetchItems={async (page, search) => {
            const limit = 20;
            let filteredIcons: IconName[] = [...iconNames];
            const valueIndex = filteredIcons.indexOf(element.icon as IconName);
            if (valueIndex !== -1) {
              const currentIcon = filteredIcons[valueIndex]!;
              filteredIcons.splice(valueIndex, 1);
              filteredIcons.unshift(currentIcon);
            }
            if (search) {
              const q = search.toLowerCase();
              filteredIcons = filteredIcons.filter(
                (iconName) =>
                  iconName.toLowerCase().includes(q) ||
                  formatLucideIconLabel(iconName).toLowerCase().includes(q),
              );
            }
            const items: IComboboxItem[] = filteredIcons
              .slice((page - 1) * limit, page * limit)
              .map((iconName) => ({
                value: iconName,
                label: (
                  <div className="flex flex-row gap-2 items-center">
                    <Icon name={iconName} size={16} />
                    <span>{formatLucideIconLabel(iconName)}</span>
                  </div>
                ),
              }));
            return {
              items,
              hasMore: page * limit < filteredIcons.length,
            };
          }}
          value={element.icon}
          size="sm"
          className="w-full"
          onChange={(value) => {
            if (value)
              updateElement(element.id, {
                icon: value as IconElement["icon"],
              });
          }}
        />
      </div>
      <div>
        <Label className="text-xs text-foreground">
          {t("designer.properties.color")}
        </Label>
        <Input
          type="color"
          value={element.styles?.color ?? "#000000"}
          onChange={(e) =>
            updateElement(element.id, {
              styles: { ...element.styles, color: e.target.value },
            })
          }
          className="h-8 w-full cursor-pointer"
        />
      </div>
      <div>
        <Label className="text-xs text-foreground">
          {t("designer.properties.strokeWidth")}
        </Label>
        <Input
          type="number"
          min={0.1}
          max={8}
          step={0.1}
          value={element.styles?.strokeWidth ?? 1}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!Number.isFinite(v) || v < 0) return;
            updateElement(element.id, {
              styles: { ...element.styles, strokeWidth: v },
            });
          }}
          className="h-8 w-full"
        />
      </div>
    </div>
  );

  return (
    <div className="flex-1 border-b border-border p-4 overflow-auto h-full">
      <h2 className="text-sm font-semibold mb-4 text-foreground">
        {t("designer.properties.title")}
      </h2>

      <div className="space-y-4 mb-6">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-transparent"
            onClick={() => bringToFront(selectedElement.id)}
          >
            <ArrowUp className="w-3 h-3 mr-1" />
            {t("designer.properties.toFront")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-transparent"
            onClick={() => sendToBack(selectedElement.id)}
          >
            <ArrowDown className="w-3 h-3 mr-1" />
            {t("designer.properties.toBack")}
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs text-foreground">
            {t("designer.properties.lock")}
          </Label>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              updateElement(selectedElement.id, {
                locked: !selectedElement.locked,
              })
            }
          >
            {selectedElement.locked ? (
              <Lock className="w-4 h-4" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
          </Button>
        </div>

        <div>
          <Label className="text-xs mb-2 block text-foreground">
            {t("designer.properties.opacity")}
          </Label>
          <Slider
            value={[selectedElement.opacity * 100]}
            onValueChange={([value]) =>
              updateElement(selectedElement.id, { opacity: value / 100 })
            }
            max={100}
            step={1}
            className="mb-2"
          />
          <span className="text-xs text-muted-foreground">
            {Math.round(selectedElement.opacity * 100)}%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-foreground">
              {t("designer.properties.x")}
            </Label>
            <Input
              type="number"
              value={Math.round(selectedElement.position.x)}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  position: {
                    ...selectedElement.position,
                    x: Number(e.target.value),
                  },
                })
              }
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-foreground">
              {t("designer.properties.y")}
            </Label>
            <Input
              type="number"
              value={Math.round(selectedElement.position.y)}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  position: {
                    ...selectedElement.position,
                    y: Number(e.target.value),
                  },
                })
              }
              className="h-8 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-foreground">
              {t("designer.properties.width")}
            </Label>
            <Input
              type="number"
              value={Math.round(selectedElement.size.width)}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  size: {
                    ...selectedElement.size,
                    width: Number(e.target.value),
                  },
                })
              }
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-foreground">
              {t("designer.properties.height")}
            </Label>
            <Input
              type="number"
              value={Math.round(selectedElement.size.height)}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  size: {
                    ...selectedElement.size,
                    height: Number(e.target.value),
                  },
                })
              }
              className="h-8 text-sm"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs mb-2 block text-foreground">
            {t("designer.properties.rotation")}
          </Label>
          <Slider
            value={[selectedElement.rotation]}
            onValueChange={([value]) =>
              updateElement(selectedElement.id, { rotation: value })
            }
            max={360}
            step={1}
            className="mb-2"
          />
          <span className="text-xs text-muted-foreground">
            {selectedElement.rotation}°
          </span>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="text-xs font-semibold mb-4 uppercase text-muted-foreground">
          {t("designer.properties.elementSpecific")}
        </h3>
        {selectedElement.type === "text" &&
          renderTextProperties(selectedElement as TextElement)}
        {selectedElement.type === "shape" &&
          renderShapeProperties(selectedElement as ShapeElement)}
        {selectedElement.type === "image" &&
          renderImageProperties(selectedElement as ImageElement)}
        {selectedElement.type === "icon" &&
          renderIconProperties(selectedElement as IconElement)}
      </div>
    </div>
  );
}
