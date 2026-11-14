import { DragOverlay } from "@dnd-kit/react";
import { useI18n } from "@hacado/i18n/client";
import { Button } from "@hacado/ui/button";
import { cn } from "@hacado/ui/cn";
import { TabsContent } from "@hacado/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { memo, useMemo } from "react";
import { EditorBlock } from "../../documents/editor/block";
import {
  useActiveDragBlock,
  useActiveOverBlock,
  useBlock,
  useBlockDepth,
  useFocusedModalId,
  useRootBlockId,
  useSetFocusedModalId,
} from "../../documents/editor/context";
import { OverlayProvider } from "../overlay/context";

export const ActiveOverblockDebug = () => {
  const activeOverBlock = useActiveOverBlock();
  const block = useBlock(activeOverBlock?.blockId ?? null);
  const depth = useBlockDepth(activeOverBlock?.blockId ?? null);
  return (
    <div className="py-4 px-2 mx-auto w-full bg-red-800 text-white">
      Active Over Block:{" "}
      {block ? (
        <>
          {block.type}, {activeOverBlock?.property}, {activeOverBlock?.index},{" "}
          {depth}
        </>
      ) : (
        <>none</>
      )}
    </div>
  );
};

const FocusedModalBar = memo(() => {
  const t = useI18n("builder");
  const focusedModalId = useFocusedModalId();
  const setFocusedModalId = useSetFocusedModalId();
  const focusedBlock = useBlock(focusedModalId);

  if (!focusedModalId) return null;

  return (
    <div className="flex items-center gap-2 border-b bg-background px-3 py-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setFocusedModalId(null)}
      >
        <ArrowLeft className="h-4 w-4" />
        {t("baseBuilder.modals.backToList")}
      </Button>
      {focusedBlock?.type ? (
        <span className="text-sm text-muted-foreground truncate">
          {focusedBlock.type}
        </span>
      ) : null}
    </div>
  );
});

export const Editor = memo(({ selectedView }: { selectedView: string }) => {
  const rootBlockId = useRootBlockId();
  const focusedModalId = useFocusedModalId();
  const isFocusedModal = !!focusedModalId;
  const canvasRootId = isFocusedModal ? focusedModalId! : rootBlockId;
  const isVisible = selectedView === "editor";

  // We are using forceMount to avoid the editor from being unmounted when the tab is not selected
  // This is because the editor is a large component and we want to avoid the re-rendering of the editor when the tab is not selected
  // This is a workaround to avoid the editor from being unmounted when the tab is not selected
  return (
    <TabsContent
      value="editor"
      className={cn("mt-0", !isVisible && "hidden")}
      forceMount
    >
      {isFocusedModal ? <FocusedModalBar /> : null}
      <OverlayProvider>
        <EditorBlock
          blockId={canvasRootId}
          index={0}
          parentBlockId={canvasRootId}
          parentProperty="props"
        />
      </OverlayProvider>
    </TabsContent>
  );
});

export const BlockDragOverlay = memo(() => {
  const activeDragBlock = useActiveDragBlock();

  const dragBlockId = activeDragBlock?.blockId;
  const RenderedBlock = useMemo(() => {
    if (!dragBlockId) return null;

    return (
      <EditorBlock
        blockId={dragBlockId}
        index={0}
        parentBlockId={""}
        parentProperty={""}
        disableClone
        disableDelete
        disableMove
        disableDrag
        isOverlay
      />
    );
  }, [dragBlockId]);

  return (
    <DragOverlay className="relative">
      <style>
        {`
          @scope {
            * {
              transition: none !important;
              animation: none !important;
            }
          }
        `}
      </style>
      {RenderedBlock}
      <div className="absolute inset-0 bg-blue-400/50 z-50" />
    </DragOverlay>
  );
});
