"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  Button,
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
  TooltipResponsive,
  TooltipResponsiveContent,
  TooltipResponsiveTrigger,
} from "@hacado/ui";
import {
  AlertCircle,
  CheckCircle,
  Edit3,
  Eye,
  PanelLeft,
  PanelRight,
  Redo,
  Undo,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
  giftCardStudioAdminNamespace,
} from "../../translations/types";
import { useEditorStore } from "../lib/store";
import { CanvasSetupDialog } from "./canvas-setup-dialog";

export interface CanvasToolbarProps {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
}

export function Toolbar({
  leftPanelOpen,
  rightPanelOpen,
  onToggleLeft,
  onToggleRight,
}: CanvasToolbarProps) {
  const {
    zoom,
    setZoom,
    undo,
    redo,
    historyIndex,
    history,
    mode,
    setMode,
    design,
  } = useEditorStore();

  const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
    giftCardStudioAdminNamespace,
  );

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Validation logic
  const requiredFieldKeys = ["amount", "code"];
  const hasRequiredFields = () => {
    const textElements = design.elements.filter(
      (el) => el.type === "text",
    ) as any[];
    const fieldKeys = textElements.map((el) => el.fieldKey).filter(Boolean);
    return requiredFieldKeys.every((key) => fieldKeys.includes(key));
  };

  const validationMessages = () => {
    const messages: string[] = [];
    const textElements = design.elements.filter(
      (el) => el.type === "text",
    ) as any[];
    const fieldKeys = textElements.map((el) => el.fieldKey).filter(Boolean);

    requiredFieldKeys.forEach((key) => {
      if (!fieldKeys.includes(key)) {
        const label =
          key === "amount"
            ? t("designer.dynamicFields.amount")
            : t("designer.dynamicFields.code");
        messages.push(t("designer.toolbar.missingRequiredField", { label }));
      }
    });

    if (messages.length === 0) {
      messages.push(t("designer.toolbar.allRequiredPresent"));
    }

    return messages;
  };

  const isValid = hasRequiredFields();

  // const handleExportPDF = async () => {
  //   const canvasElement = document.querySelector("#gift-card-editor-canvas")
  //   if (!canvasElement) {
  //     toast.error("Canvas element not found")
  //     return
  //   }

  //   setIsExporting(true)
  //   toast.loading("Exporting PDF...")

  //   try {
  //     await exportToPDF(design, canvasElement as HTMLElement)
  //     toast.success("Your gift card PDF has been downloaded")
  //   } catch (error) {
  //     toast.error("There was an error exporting your PDF")
  //   } finally {
  //     setIsExporting(false)
  //   }
  // }

  // const handleExportPDFServer = async () => {
  //   setIsExporting(true)
  //   toast.loading("Rendering your design on the server...")
  //   try {
  //     // Collect sample values as fields so dynamic text is populated
  //     const fields: Record<string, string> = {}
  //     design.elements.forEach((el) => {
  //       if (el.type === "text" && (el as any).fieldKey && (el as any).sampleValue) {
  //         fields[(el as any).fieldKey] = (el as any).sampleValue
  //       }
  //     })
  //     await exportToPDFServer(design, fields)
  //     toast.success("Your gift card PDF has been downloaded")
  //   } catch (error) {
  //     toast.error(error instanceof Error ? error.message : "Server render failed")
  //   } finally {
  //     setIsExporting(false)
  //   }
  // }

  // const handleExportJSON = async () => {
  //   try {
  //     await exportDesignAsJSON(design)
  //     toast.success("Your design has been exported as JSON")
  //   } catch (error) {
  //     toast.error("There was an error saving your design")
  //   }
  // }

  // const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0]
  //   if (!file) return

  //   const importedDesign = await importDesignFromJSON(file)
  //   if (importedDesign) {
  //     useEditorStore.setState({ design: importedDesign })
  //     useEditorStore.getState().pushHistory()
  //     toast.success("Your design has been imported successfully")
  //   } else {
  //     toast.error("Could not load the design file")
  //   }

  //   if (fileInputRef.current) {
  //     fileInputRef.current.value = ""
  //   }
  // }

  return (
    <div className="min-h-11 shrink-0 border-b border-border flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 px-2 sm:px-3 py-1.5 sm:py-0 sm:h-12 sm:min-h-0 bg-background">
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 sm:flex-none basis-[min-content] sm:basis-auto">
        <TooltipResponsive>
          <TooltipResponsiveTrigger>
            <Button
              variant={leftPanelOpen ? "secondary" : "ghost"}
              size="icon"
              className="shrink-0 size-8 sm:size-9"
              aria-expanded={leftPanelOpen}
              aria-label={
                leftPanelOpen
                  ? t("designer.toolbar.closeElementsPanel")
                  : t("designer.toolbar.openElementsPanel")
              }
              onClick={onToggleLeft}
            >
              <PanelLeft className="size-4" />
            </Button>
          </TooltipResponsiveTrigger>
          <TooltipResponsiveContent>
            {leftPanelOpen
              ? t("designer.toolbar.closeElementsPanel")
              : t("designer.toolbar.openElementsPanel")}
          </TooltipResponsiveContent>
        </TooltipResponsive>
        <h1 className="text-sm sm:text-base md:text-lg font-semibold text-foreground truncate min-w-0">
          {t("designs.form.design")}
        </h1>
        <CanvasSetupDialog />
      </div>

      <div className="flex flex-wrap items-center gap-0.5 sm:gap-1 md:gap-1.5 justify-end min-w-0">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "size-8 sm:size-9 shrink-0",
                isValid
                  ? "text-green-600 hover:text-green-700"
                  : "text-amber-600 hover:text-amber-700",
              )}
            >
              {isValid ? (
                <CheckCircle className="size-4" />
              ) : (
                <AlertCircle className="size-4" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">
                {t("designer.toolbar.validationTitle")}
              </h4>
              <div className="space-y-1">
                {validationMessages().map((message, index) => (
                  <p
                    key={index}
                    className={`text-sm ${isValid ? "text-green-600" : "text-amber-600"}`}
                  >
                    {message}
                  </p>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-5 sm:h-6 bg-border shrink-0" />

        <TooltipResponsive>
          <TooltipResponsiveTrigger>
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={!canUndo}
              className="hover:bg-accent size-8 sm:size-9"
            >
              <Undo className="size-4" />
            </Button>
          </TooltipResponsiveTrigger>
          <TooltipResponsiveContent>
            {t("designer.toolbar.undo")}
          </TooltipResponsiveContent>
        </TooltipResponsive>
        <TooltipResponsive>
          <TooltipResponsiveTrigger>
            <Button
              variant="ghost"
              size="icon"
              onClick={redo}
              disabled={!canRedo}
              className="hover:bg-accent size-8 sm:size-9"
            >
              <Redo className="size-4" />
            </Button>
          </TooltipResponsiveTrigger>
          <TooltipResponsiveContent>
            {t("designer.toolbar.redo")}
          </TooltipResponsiveContent>
        </TooltipResponsive>

        <div className="w-px h-5 sm:h-6 bg-border mx-0.5 sm:mx-1 shrink-0" />

        <TooltipResponsive>
          <TooltipResponsiveTrigger>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom(zoom - 0.1)}
              className="hover:bg-accent size-8 sm:size-9"
            >
              <ZoomOut className="size-4" />
            </Button>
          </TooltipResponsiveTrigger>
          <TooltipResponsiveContent>
            {t("designer.toolbar.zoomOut")}
          </TooltipResponsiveContent>
        </TooltipResponsive>
        <span className="text-xs sm:text-sm text-foreground w-11 sm:w-14 text-center font-mono tabular-nums shrink-0">
          {Math.round(zoom * 100)}%
        </span>
        <TooltipResponsive>
          <TooltipResponsiveTrigger>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom(zoom + 0.1)}
              className="hover:bg-accent size-8 sm:size-9"
            >
              <ZoomIn className="size-4" />
            </Button>
          </TooltipResponsiveTrigger>
          <TooltipResponsiveContent>
            {t("designer.toolbar.zoomIn")}
          </TooltipResponsiveContent>
        </TooltipResponsive>
        <div className="w-px h-5 sm:h-6 bg-border mx-0.5 sm:mx-1 shrink-0" />

        <Button
          variant={mode === "edit" ? "default" : "ghost"}
          size="sm"
          className="h-8 px-2 sm:px-3 gap-1.5"
          onClick={() => setMode("edit")}
        >
          <Edit3 className="size-4 shrink-0" />
          <span className="hidden sm:inline">{t("designer.toolbar.edit")}</span>
        </Button>
        <Button
          variant={mode === "preview" ? "default" : "ghost"}
          size="sm"
          className="h-8 px-2 sm:px-3 gap-1.5"
          onClick={() => setMode("preview")}
        >
          <Eye className="size-4 shrink-0" />
          <span className="hidden sm:inline">
            {t("designer.toolbar.preview")}
          </span>
        </Button>

        <div className="w-px h-5 sm:h-6 bg-border mx-0.5 sm:mx-1 shrink-0" />

        <TooltipResponsive>
          <TooltipResponsiveTrigger>
            <Button
              variant={rightPanelOpen ? "secondary" : "ghost"}
              size="icon"
              className="shrink-0 size-8 sm:size-9"
              aria-expanded={rightPanelOpen}
              aria-label={
                rightPanelOpen
                  ? t("designer.toolbar.closePropertiesPanel")
                  : t("designer.toolbar.openPropertiesPanel")
              }
              onClick={onToggleRight}
            >
              <PanelRight className="size-4" />
            </Button>
          </TooltipResponsiveTrigger>
          <TooltipResponsiveContent>
            {rightPanelOpen
              ? t("designer.toolbar.closePropertiesPanel")
              : t("designer.toolbar.openPropertiesPanel")}
          </TooltipResponsiveContent>
        </TooltipResponsive>

        {/* <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportJSON} className="hidden" />

        <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
          <Upload className="w-4 h-4" />
          Import
        </Button> */}

        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-2" disabled={isExporting}>
              <Download className="w-4 h-4" />
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportPDFServer}>
              <Download className="w-4 h-4 mr-2" />
              Export as PDF (Server)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-2" />
              Export as PDF (Client)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportJSON}>
              <Download className="w-4 h-4 mr-2" />
              Save Design (JSON)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> */}
      </div>
    </div>
  );
}
