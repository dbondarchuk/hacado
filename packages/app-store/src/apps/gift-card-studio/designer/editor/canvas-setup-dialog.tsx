"use client";

import { useI18n } from "@timelish/i18n/client";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@timelish/ui";
import { Settings } from "lucide-react";
import { useState } from "react";
import {
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
  giftCardStudioAdminNamespace,
} from "../../translations/types";
import { useEditorStore } from "../lib/store";
import { ASPECT_RATIOS } from "../lib/types";

const aspectRatioLabelKeys: Record<
  string,
  | "designer.canvasSetup.aspectRatio3_2"
  | "designer.canvasSetup.aspectRatio4_3"
  | "designer.canvasSetup.aspectRatio1_1"
  | "designer.canvasSetup.aspectRatio16_9"
  | "designer.canvasSetup.aspectRatioCustom"
> = {
  "3:2": "designer.canvasSetup.aspectRatio3_2",
  "4:3": "designer.canvasSetup.aspectRatio4_3",
  "1:1": "designer.canvasSetup.aspectRatio1_1",
  "16:9": "designer.canvasSetup.aspectRatio16_9",
  custom: "designer.canvasSetup.aspectRatioCustom",
};

export function CanvasSetupDialog() {
  const { design, setCanvas } = useEditorStore();
  const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
    giftCardStudioAdminNamespace,
  );
  const [open, setOpen] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(design.canvas.aspectRatio);
  const [width, setWidth] = useState(design.canvas.width);
  const [height, setHeight] = useState(design.canvas.height);
  const [theme, setTheme] = useState(design.canvas.theme || "light");

  const handleAspectRatioChange = (value: string) => {
    setAspectRatio(value);
    const ratio = ASPECT_RATIOS.find((r) => r.value === value);
    if (ratio && ratio.ratio) {
      setHeight(Math.round(width / ratio.ratio));
    }
  };

  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth);
    const ratio = ASPECT_RATIOS.find((r) => r.value === aspectRatio);
    if (ratio && ratio.ratio) {
      setHeight(Math.round(newWidth / ratio.ratio));
    }
  };

  const handleApply = () => {
    setCanvas({ width, height, aspectRatio, theme });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-accent size-8 sm:size-9 shrink-0"
        >
          <Settings className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("designer.canvasSetup.title")}</DialogTitle>
          <DialogDescription>
            {t("designer.canvasSetup.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>{t("designer.canvasSetup.canvasTheme")}</Label>
            <Select
              value={theme}
              onValueChange={(value: "light" | "dark") => setTheme(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  {t("designer.canvasSetup.light")}
                </SelectItem>
                <SelectItem value="dark">
                  {t("designer.canvasSetup.dark")}
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {t("designer.canvasSetup.themeHint")}
            </p>
          </div>

          <div>
            <Label>{t("designer.canvasSetup.aspectRatio")}</Label>
            <Select value={aspectRatio} onValueChange={handleAspectRatioChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASPECT_RATIOS.map((ratio) => (
                  <SelectItem key={ratio.value} value={ratio.value}>
                    {aspectRatioLabelKeys[ratio.value]
                      ? t(aspectRatioLabelKeys[ratio.value])
                      : ratio.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t("designer.canvasSetup.widthPx")}</Label>
              <Input
                type="number"
                value={width}
                onChange={(e) => handleWidthChange(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>{t("designer.canvasSetup.heightPx")}</Label>
              <Input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                disabled={aspectRatio !== "custom"}
              />
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {t("designer.canvasSetup.currentSize", {
              width: design.canvas.width,
              height: design.canvas.height,
              theme:
                design.canvas.theme === "dark"
                  ? t("designer.canvasSetup.themeDark")
                  : t("designer.canvasSetup.themeLight"),
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("designer.canvasSetup.cancel")}
          </Button>
          <Button onClick={handleApply}>
            {t("designer.canvasSetup.apply")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
