"use client";

import { BuilderKeys, useI18n } from "@timelish/i18n/client";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@timelish/ui";
import { Grid3X3 } from "lucide-react";
import React, { useState } from "react";

type GridTrack = "columns" | "rows";

interface GridTemplateTracksDialogProps {
  track: GridTrack;
  value: string;
  onChange: (value: string) => void;
  trigger: React.ReactNode;
}

type GridType =
  | "fixed"
  | "responsive"
  | "masonry"
  | "sidebar"
  | "hero"
  | "magazine"
  | "gallery"
  | "dashboard"
  | "custom";

const dialogPrefix = (track: GridTrack) =>
  track === "columns"
    ? "pageBuilder.styles.gridTemplateColumnsDialog"
    : "pageBuilder.styles.gridTemplateRowsDialog";

export const GridTemplateTracksDialog: React.FC<
  GridTemplateTracksDialogProps
> = ({ track, value, onChange, trigger }) => {
  const [open, setOpen] = useState(false);
  const [gridType, setGridType] = useState<GridType>("responsive");
  const [trackCount, setTrackCount] = useState(3);
  const [minSize, setMinSize] = useState(track === "columns" ? 250 : 150);
  const [sidebarSize, setSidebarSize] = useState(250);
  const [customValue, setCustomValue] = useState(value);
  const t = useI18n("builder");
  const prefix = dialogPrefix(track);

  const columnKeyAliases: Record<string, string> = {
    minSize: "minWidth",
    trackCount: "columnCount",
    sidebarSize: "sidebarWidth",
    track: "column",
    tracks: "columns",
  };

  const tk = (key: string) =>
    t(
      `${prefix}.${track === "columns" ? (columnKeyAliases[key] ?? key) : key}` as BuilderKeys,
    );

  const generateTemplate = () => {
    let template = "";

    switch (gridType) {
      case "fixed":
        template = `repeat(${trackCount}, 1fr)`;
        break;
      case "responsive":
        template = `repeat(auto-fit, minmax(${minSize}px, 1fr))`;
        break;
      case "masonry":
        template = `repeat(auto-fill, minmax(${minSize}px, 1fr))`;
        break;
      case "sidebar":
        template = `${sidebarSize}px 1fr`;
        break;
      case "hero":
        template = `1fr`;
        break;
      case "magazine":
        template = `2fr 1fr 1fr`;
        break;
      case "gallery":
        template = `repeat(auto-fit, minmax(300px, 1fr))`;
        break;
      case "dashboard":
        template = `repeat(auto-fit, minmax(200px, 1fr))`;
        break;
      case "custom":
        template = customValue;
        break;
    }

    onChange(template);
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setCustomValue(value);
    }
  };

  const previewTemplate = () => {
    switch (gridType) {
      case "responsive":
        return `repeat(auto-fit, minmax(${minSize}px, 1fr))`;
      case "fixed":
        return `repeat(${trackCount}, 1fr)`;
      case "masonry":
        return `repeat(auto-fill, minmax(${minSize}px, 1fr))`;
      case "sidebar":
        return `${sidebarSize}px 1fr`;
      case "hero":
        return `1fr`;
      case "magazine":
        return `2fr 1fr 1fr`;
      case "gallery":
        return `repeat(auto-fit, minmax(300px, 1fr))`;
      case "dashboard":
        return `repeat(auto-fit, minmax(200px, 1fr))`;
      case "custom":
        return customValue;
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Grid3X3 className="w-5 h-5" />
            {tk("title")}
          </DialogTitle>
          <DialogDescription>{tk("description")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <RadioGroup
            value={gridType}
            onValueChange={(value) => setGridType(value as GridType)}
          >
            <div className="grid gap-3">
              {(
                [
                  "responsive",
                  "fixed",
                  "masonry",
                  "sidebar",
                  "hero",
                  "magazine",
                  "gallery",
                  "dashboard",
                  "custom",
                ] as const
              ).map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <RadioGroupItem value={type} id={`${track}-${type}`} />
                  <Label htmlFor={`${track}-${type}`} className="flex-1">
                    {tk(type)}
                    <div className="text-xs text-muted-foreground font-normal">
                      {tk(`${type}Description`)}
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>

          {(gridType === "responsive" || gridType === "masonry") && (
            <div className="grid gap-2">
              <Label htmlFor={`${track}-minSize`}>{tk("minSize")}</Label>
              <Input
                id={`${track}-minSize`}
                type="number"
                value={minSize}
                onChange={(e) => setMinSize(Number(e.target.value))}
                min={50}
                max={1000}
                step={10}
              />
            </div>
          )}

          {gridType === "fixed" && (
            <div className="grid gap-2">
              <Label htmlFor={`${track}-trackCount`}>{tk("trackCount")}</Label>
              <Select
                value={trackCount.toString()}
                onValueChange={(value) => setTrackCount(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? tk("track") : tk("tracks")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {gridType === "sidebar" && (
            <div className="grid gap-2">
              <Label htmlFor={`${track}-sidebarSize`}>
                {tk("sidebarSize")}
              </Label>
              <Input
                id={`${track}-sidebarSize`}
                type="number"
                value={sidebarSize}
                onChange={(e) => setSidebarSize(Number(e.target.value))}
                min={100}
                max={500}
                step={10}
              />
            </div>
          )}

          {gridType === "custom" && (
            <div className="grid gap-2">
              <Label htmlFor={`${track}-customValue`}>
                {tk("customTemplate")}
              </Label>
              <Input
                id={`${track}-customValue`}
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder={
                  track === "columns"
                    ? "e.g., 1fr 2fr 1fr, repeat(3, 1fr), 200px 1fr"
                    : "e.g., auto 1fr auto, repeat(3, minmax(100px, auto))"
                }
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label>{tk("preview")}</Label>
            <div className="p-3 bg-muted rounded-md text-sm font-mono">
              {previewTemplate()}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {tk("cancel")}
          </Button>
          <Button onClick={generateTemplate}>{tk("applyTemplate")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
