"use client";

import { useI18n } from "@timelish/i18n/client";
import {
  cn,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@timelish/ui";
import { useEffect, useLayoutEffect, useState } from "react";
import {
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
  giftCardStudioAdminNamespace,
} from "../../translations/types";
import { EDITOR_FONTS } from "../lib/fonts";
import { isTypingInInput } from "../lib/keyboard";
import { useEditorStore } from "../lib/store";
import { CanvasWorkspace } from "./canvas-workspace";
import { LayersPanel } from "./layers-panel";
import { PropertiesPanel } from "./properties-panel";
import { Sidebar } from "./sidebar";
import { Toolbar } from "./toolbar";

const LG_MEDIA = "(min-width: 1024px)";

interface EditorLayoutProps {
  allowGrouping?: boolean;
  /** When true, use h-full instead of h-screen so the editor fits inside a parent container (e.g. form). */
  embedded?: boolean;
}

export function EditorLayout({
  allowGrouping = true,
  embedded = false,
}: EditorLayoutProps = {}) {
  const {
    undo,
    redo,
    deleteElement,
    selectedElements,
    duplicateElement,
    updateElement,
    design,
  } = useEditorStore();

  const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
    giftCardStudioAdminNamespace,
  );

  const [isLgUp, setIsLgUp] = useState(false);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia(LG_MEDIA);
    const sync = () => {
      const lg = mq.matches;
      setIsLgUp(lg);
      setLeftOpen(lg);
      setRightOpen(lg);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Inject Google Fonts stylesheet so previews render correctly
  useEffect(() => {
    const id = "editor-font-preload";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    // Load all editor fonts in regular + bold so dropdown previews look right
    const params = EDITOR_FONTS.map(
      (f) => `family=${encodeURIComponent(f.value)}:wght@400;700`,
    ).join("&");
    link.href = `https://fonts.googleapis.com/css2?${params}&display=swap`;
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Never fire editor shortcuts while the user is typing in an input,
      // textarea, select, or contenteditable (properties panel / in-canvas text).
      if (isTypingInInput(e)) return;

      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) &&
        selectedElements.length > 0
      ) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1; // Larger step with shift
        const dx =
          e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy =
          e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;

        selectedElements.forEach((id) => {
          const element = design.elements.find((el) => el.id === id);
          if (element && !element.locked) {
            updateElement(id, {
              position: {
                x: element.position.x + dx,
                y: element.position.y + dy,
              },
            });
          }
        });
        useEditorStore.getState().pushHistory();
        return;
      }

      // Undo: Cmd/Ctrl + Z
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Redo: Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y
      if (
        ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "z") ||
        ((e.metaKey || e.ctrlKey) && e.key === "y")
      ) {
        e.preventDefault();
        redo();
      }

      // Delete: Delete or Backspace
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedElements.length > 0
      ) {
        e.preventDefault();
        selectedElements.forEach((id) => deleteElement(id));
      }

      // Duplicate: Cmd/Ctrl + D
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key === "d" &&
        selectedElements.length > 0
      ) {
        e.preventDefault();
        selectedElements.forEach((id) => duplicateElement(id));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    undo,
    redo,
    deleteElement,
    selectedElements,
    duplicateElement,
    updateElement,
    design.elements,
  ]);

  const toggleLeft = () => {
    setLeftOpen((prev) => {
      const next = !prev;
      if (next && !isLgUp) setRightOpen(false);
      return next;
    });
  };

  const toggleRight = () => {
    setRightOpen((prev) => {
      const next = !prev;
      if (next && !isLgUp) setLeftOpen(false);
      return next;
    });
  };

  const rightPanelInner = (
    <ResizablePanelGroup
      direction="vertical"
      className="w-full min-w-0 flex flex-col min-h-0 h-full overflow-hidden"
    >
      <ResizablePanel minSize={10} className="overflow-y-auto">
        <PropertiesPanel />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel minSize={10} className="overflow-y-auto">
        <LayersPanel allowGrouping={allowGrouping} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );

  return (
    <div
      className={
        embedded
          ? "h-full flex flex-col bg-background"
          : "h-screen flex flex-col bg-background"
      }
    >
      <Toolbar
        leftPanelOpen={leftOpen}
        rightPanelOpen={rightOpen}
        onToggleLeft={toggleLeft}
        onToggleRight={toggleRight}
      />
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Desktop: docked left sidebar */}
        <div
          className={cn(
            "hidden lg:flex shrink-0 border-r border-border bg-background overflow-hidden transition-[width] duration-200 ease-out",
            leftOpen ? "w-64" : "w-0 border-transparent",
          )}
        >
          <div className="w-64 h-full min-h-0 shrink-0 flex flex-col overflow-hidden">
            <Sidebar />
          </div>
        </div>

        {!isLgUp && (
          <Sheet open={leftOpen} onOpenChange={setLeftOpen}>
            <SheetContent
              side="left"
              className="flex flex-col p-0 gap-0 w-[min(20rem,100vw)] sm:max-w-sm [&>button]:right-2 [&>button]:top-3"
            >
              <SheetHeader className="px-4 pt-4 pb-3 border-b shrink-0 space-y-0 text-left">
                <SheetTitle className="text-base pr-8">
                  {t("designer.layout.elementsSheetTitle")}
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 min-h-0 overflow-auto">
                <Sidebar />
              </div>
            </SheetContent>
          </Sheet>
        )}

        <CanvasWorkspace allowGrouping={allowGrouping} />

        {/* Desktop: docked right stack */}
        <div
          className={cn(
            "hidden lg:flex shrink-0 border-l border-border bg-background overflow-hidden transition-[width] duration-200 ease-out",
            rightOpen ? "w-80" : "w-0 border-transparent",
          )}
        >
          <div className="w-80 h-full min-h-0 shrink-0 flex flex-col overflow-hidden">
            {rightPanelInner}
          </div>
        </div>

        {!isLgUp && (
          <Sheet open={rightOpen} onOpenChange={setRightOpen}>
            <SheetContent
              side="right"
              className="flex flex-col p-0 gap-0 w-[min(20rem,100vw)] sm:max-w-sm [&>button]:right-2 [&>button]:top-3"
            >
              <SheetHeader className="px-4 pt-4 pb-3 border-b shrink-0 space-y-0 text-left">
                <SheetTitle className="text-base pr-8">
                  {t("designer.layout.propertiesSheetTitle")}
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                {rightPanelInner}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </div>
  );
}
