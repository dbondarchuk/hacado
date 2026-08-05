"use client";

import {
  DragDropProvider,
  KeyboardSensor,
  PointerSensor,
} from "@dnd-kit/react";
import { effect } from "@dnd-kit/state";
import { useI18n } from "@hacado/i18n/client";
import { Tabs, useThrottleCallback } from "@hacado/ui";
import { ComponentProps, memo } from "react";
import {
  getActiveOverBlockContext,
  useDisableAnimation,
  useDispatchAction,
  useEditorStateStore,
  useSelectedScreenSize,
  useSelectedView,
  useSetActiveDragBlockId,
  useSetActiveOverBlockContextId,
  useSetDisableAnimation,
  useTemplates,
} from "../../documents/editor/context";
import { TEditorBlock } from "../../documents/editor/core";
import { generateId } from "../../documents/helpers/block-id";
import { ReaderDocumentBlocksDictionary } from "../../documents/reader/core";
import { DndContext } from "../../types/dndContext";
import { BlocksSidebar } from "./blocks-sidebar";
import { BlockDragOverlay, Editor } from "./editor";
import { Preview } from "./preview";
import { ViewportEmulator } from "./viewport-emulator";

type TemplatePanelProps = {
  args?: Record<string, any>;
  readerBlocks: ReaderDocumentBlocksDictionary<any>;
  header?: React.ReactNode;
  footer?: React.ReactNode;
};

const EnableDisableAnimations = memo(
  ({ children }: { children: React.ReactNode | React.ReactNode[] }) => {
    const disableAnimation = useDisableAnimation();
    return (
      <>
        <style>
          {disableAnimation
            ? `
        * {
          transition: none !important;
          animation: none !important;
        }
      `
            : ""}
        </style>
        {children}
      </>
    );
  },
);

const sensors = [
  PointerSensor.configure({
    activatorElements(source) {
      if (
        source.data?.type === "block-template" ||
        source.data?.type === "composite-template"
      ) {
        // Allow pointer sensor to activate on the element and the handle for template blocks
        return [source.element, source.handle];
      } else {
        // Force pointer sensor to only activate on the handle for document blocks
        return [source.handle];
      }
    },
  }),
  KeyboardSensor,
];

export const TemplatePanel: React.FC<TemplatePanelProps> = memo(
  ({ args, readerBlocks, header, footer }) => {
    const t = useI18n();
    const dispatchAction = useDispatchAction();
    const setActiveDragBlock = useSetActiveDragBlockId();
    const setActiveOverBlock = useSetActiveOverBlockContextId();
    const templates = useTemplates();

    const selectedScreenSize = useSelectedScreenSize();
    const selectedView = useSelectedView();

    const setDisableAnimation = useSetDisableAnimation();

    const store = useEditorStateStore();

    const onDragStart: ComponentProps<
      typeof DragDropProvider
    >["onDragStart"] = (event) => {
      const blockId = event.operation.source?.id as string;
      setDisableAnimation(true);

      // Handle block template drag (from blocks panel)
      if (blockId.startsWith("template-")) {
        const blockData = event.operation.source?.data;

        if (blockData?.type === "block-template") {
          // Create a new block instance
          const newBlock: TEditorBlock = {
            id: blockData.blockConfig.id || `temp-${Date.now()}`,
            type: blockData.blockType,
            data:
              typeof blockData.blockConfig.defaultValue === "function"
                ? blockData.blockConfig.defaultValue(t)
                : blockData.blockConfig.defaultValue,
            metadata: blockData.blockConfig.defaultMetadata,
          };

          setActiveDragBlock(newBlock.id, newBlock);
          return;
        } else if (blockData?.type === "composite-template") {
          const template = templates?.[blockData.blockType];
          if (template) {
            const newBlock = template.getBlock(t);
            setActiveDragBlock(newBlock.id, newBlock);
            return;
          }
        }
      }

      setActiveDragBlock(blockId);
    };

    const onDragOver: ComponentProps<typeof DragDropProvider>["onDragOver"] =
      useThrottleCallback(
        (event, manager) => {
          const targetContext = event.operation.target?.data
            .context as DndContext;
          if (!targetContext) {
            // We don't want to reset the active over block if we are dragging over a block that is not a sortable block
            return;
          }

          const { dragOperation } = event.operation.source?.manager ?? {};
          if (!dragOperation) {
            // We don't want to reset the active over block if we are dragging over a block that is not a sortable block
            return;
          }

          let modifier = 0;

          const collisionData = manager.collisionObserver.collisions[0]?.data;
          if (collisionData) {
            const collisionPosition =
              collisionData?.direction === "up" ||
              collisionData?.direction === "left"
                ? "before"
                : "after";
            modifier = collisionPosition === "after" ? 1 : 0;
          } else {
            const position =
              dragOperation.shape?.current.center ??
              dragOperation.position.current;
            const target = event.operation.target;
            const isBelowTarget =
              target?.shape &&
              Math.round(position.y) > Math.round(target.shape.center.y);
            modifier = isBelowTarget ? 1 : 0;
          }

          const index = targetContext.index + modifier;

          setActiveOverBlock({
            blockId: targetContext.parentBlockId,
            property: targetContext.parentProperty,
            index,
          });
        },
        [setActiveOverBlock],
        100,
      );

    const onDragEnd: ComponentProps<typeof DragDropProvider>["onDragEnd"] = (
      event,
      manager,
    ) => {
      const activeOverBlock = getActiveOverBlockContext(store.getState());

      setActiveDragBlock(null);
      setActiveOverBlock(null);

      // Delay insert until animation has finished
      let dispose: () => void | undefined;

      dispose = effect(() => {
        if (event.operation.source?.status === "idle") {
          setDisableAnimation(false);
          dispose?.();
        }
      });

      if (event.canceled) return;

      const activeId = event.operation.source?.id as string;
      if (!activeId) return;

      if (!activeOverBlock) return;

      // Handle block template drop
      if (activeId.startsWith("template-")) {
        const blockData = event.operation.source?.data;

        if (blockData?.type === "block-template") {
          const newBlock: TEditorBlock = {
            id: generateId(),
            type: blockData.blockType,
            data:
              typeof blockData.blockConfig.defaultValue === "function"
                ? blockData.blockConfig.defaultValue(t)
                : blockData.blockConfig.defaultValue,
            metadata: blockData.blockConfig.defaultMetadata,
          };

          dispatchAction({
            type: "add-block",
            value: {
              block: newBlock,
              parentBlockId: activeOverBlock.blockId,
              parentBlockProperty: activeOverBlock.property,
              index: activeOverBlock.index,
            },
          });

          return;
        } else if (blockData?.type === "composite-template") {
          const template = templates?.[blockData.blockType];
          if (template) {
            const newBlock = template.getBlock(t);
            dispatchAction({
              type: "add-block",
              value: {
                block: newBlock,
                parentBlockId: activeOverBlock.blockId,
                parentBlockProperty: activeOverBlock.property,
                index: activeOverBlock.index,
              },
            });
            return;
          }
        }
      }

      dispatchAction({
        type: "move-block",
        value: {
          blockId: activeId,
          parentBlockId: activeOverBlock.blockId,
          parentBlockProperty: activeOverBlock.property,
          index: activeOverBlock.index,
        },
      });
      // }
    };

    return (
      <Tabs value={selectedView}>
        <div className="flex flex-col w-full mt-2">
          <DragDropProvider
            sensors={sensors}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOver={(...args) => {
              args[0].preventDefault();
              onDragOver(...args);
            }}
          >
            <div className="relative flex h-full">
              {selectedView === "editor" && (
                <>
                  <BlocksSidebar className="h-full" />
                  <BlockDragOverlay />
                </>
              )}
              <div className="flex-1">
                <ViewportEmulator viewportSize={selectedScreenSize}>
                  <EnableDisableAnimations>
                    {/* Main Editor Area */}
                    {header}
                    <Editor selectedView={selectedView} />
                    <Preview args={args} readerBlocks={readerBlocks} />
                    {footer}
                  </EnableDisableAnimations>
                </ViewportEmulator>
              </div>
            </div>
          </DragDropProvider>
        </div>
      </Tabs>
    );
  },
);
