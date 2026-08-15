"use client";

import * as z from "zod";
import { create, StoreApi, UseBoundStore, useStore } from "zustand";

import { DeepOmit, UploadedFile } from "@hacado/types";
import { deepEqual } from "@hacado/utils";
import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useRef,
} from "react";
import { useCookies } from "react-cookie";
import {
  isEditorBlockLike,
  isSlotLikeObject,
  SelectedSlotRef,
} from "../embedded-slot";
import { cloneBlock, validateBlocks } from "../helpers/blocks";
import { ReaderDocumentBlocksDictionary } from "../reader/core";
import {
  BlockFilterRuleResult,
  BuilderSchema,
  EditorDocumentBlocksDictionary,
  TemplatesConfiguration,
} from "../types";
import {
  BlockDisableOptions,
  TEditorBlock,
  TEditorConfiguration,
} from "./core";
import { EditorHistory, EditorHistoryEntry } from "./history";
import { editorHistoryReducer } from "./reducers";

export type ViewportSize =
  // | "original"
  | "desktop"
  | "largeDesktop"
  | "laptop"
  | "tablet"
  | "mobile"
  | "mobileLandscape";

export type EditorBlockIndexes = {
  [blockId: string]: {
    block: TEditorBlock;
    // UI state with children stripped from blocks
    noChildrenBlock: Omit<TEditorBlock, "data"> & {
      data: DeepOmit<TEditorBlock["data"], "children">;
    };
    blockType: string;
    parentBlockId: string | null;
    parentProperty: string | null;
    index: number;
    depth: number;
    childrenBlockIds: Record<string, string[]>; // property -> array of child block IDs
  };
};

const DEFAULT_SCREEN_SIZE = "laptop";
const SCREEN_SIZE_STORAGE_KEY = "builder-screen-size";

type View = "editor" | "preview";
const DEFAULT_VIEW: View = "editor";

type EditorState = {
  blocks: EditorDocumentBlocksDictionary<any>;
  readerBlocks: ReaderDocumentBlocksDictionary<any>;
  templates?: TemplatesConfiguration;
  rootBlock: TEditorBlock;
  schemas: BuilderSchema;

  errors: Record<
    string,
    {
      type: string;
      error: z.ZodError;
    }
  >;

  document: TEditorConfiguration;
  originalDocument: TEditorConfiguration;
  history: EditorHistory;
  onChange?: (document: TEditorConfiguration) => void;

  selectedBlockId: string | null;
  selectedSlot: SelectedSlotRef | null;
  selectedView: View;
  showBlocksPanel: boolean;
  selectedSidebarTab: "block-configuration" | "styles";
  selectedScreenSize: ViewportSize;
  fullScreen: boolean;

  getImageBlock?: (file: UploadedFile) => TEditorBlock;

  toggleInspectorDrawer: () => void;
  activeOverBlockContextId: string | null;
  activeDragBlockId: string | null;
  activeDragBlockTemplate: TEditorBlock | null;
  blockDisableOptions: Record<string, BlockDisableOptions | undefined>;
  // Key: blockId|property
  allowedRules: Record<string, BlockFilterRuleResult>;

  indexes: EditorBlockIndexes;
  templateBlockIndexes: EditorBlockIndexes | null;

  disableAnimation: boolean;

  actions: {
    dispatch: (action: EditorHistoryEntry) => void;
    setSelectedBlockId: (selectedBlockId: string | null) => void;
    setSelectedSlot: (selectedSlot: SelectedSlotRef | null) => void;
    setShowBlocksPanel: (showBlocksPanel: boolean) => void;
    toggleShowBlocksPanel: () => void;
    setSelectedSidebarTab: (
      selectedSidebarTab: "block-configuration" | "styles",
    ) => void;
    setSelectedScreenSize: (selectedScreenSize: ViewportSize) => void;
    setFullScreen: (fullScreen: boolean) => void;
    toggleFullScreen: () => void;
    setToggleInspectorDrawer: (toggleInspectorDrawer: () => void) => void;
    setDisableAnimation: (disableAnimation: boolean) => void;
    toggleDisableAnimation: () => void;
    setSelectedView: (fn: (prev: View) => View) => void;
    setActiveDragBlockId: (
      activeDragBlockId: string | null,
      activeDragBlockTemplate?: TEditorBlock | null,
    ) => void;
    setActiveOverBlockContextId: (
      activerOverBlock: {
        blockId: string;
        property: string;
        index: number;
      } | null,
    ) => void;
    setBlockDisableOptions: (
      blockId: string,
      options: BlockDisableOptions | undefined,
    ) => void;
    setAllowedRule: (
      blockId: string,
      property: string,
      rule: BlockFilterRuleResult,
    ) => void;
    setDocument: (document: TEditorConfiguration) => void;
    setOnChange: (onChange: (document: TEditorConfiguration) => void) => void;
    setRootBlock: (rootBlock: TEditorBlock) => void;
    setSchemas: (schemas: BuilderSchema) => void;
    setErrors: (
      errors: Record<string, { type: string; error: z.ZodError }>,
    ) => void;
    setHistory: (history: EditorHistory) => void;
    resetDocument: (
      document?: EditorState["document"],
      onChange?: EditorState["onChange"],
    ) => void;
    redoHistory: () => void;
    undoHistory: () => void;
  };
};

const createEditorStateStore = ({
  blocks,
  readerBlocks,
  rootBlock,
  templates,
  document,
  schemas,
  defaultScreenSize,
  persistScreenSize,
  getImageBlock,
}: {
  blocks: EditorDocumentBlocksDictionary<any>;
  readerBlocks: ReaderDocumentBlocksDictionary<any>;
  rootBlock: TEditorBlock;
  schemas: BuilderSchema;
  templates?: TemplatesConfiguration;
  document?: TEditorConfiguration;
  defaultScreenSize?: ViewportSize;
  persistScreenSize?: (screenSize: ViewportSize) => void;
  getImageBlock?: (file: UploadedFile) => TEditorBlock;
}) => {
  const defaultDocument = document || rootBlock;
  const defaultRootBlock = defaultDocument || rootBlock;
  const initialIndexes = buildIndexes(defaultDocument, schemas);

  // const [cookie, setCookie] = useCookies([
  //   SCREEN_SIZE_STORAGE_KEY,
  //   INSPECTOR_DRAWER_OPEN_STORAGE_KEY,
  // ]);

  return create<EditorState>((set, get) => ({
    document: defaultDocument,
    originalDocument: defaultDocument,
    blocks,
    readerBlocks,
    templates: templates,
    rootBlock: defaultRootBlock,
    schemas,
    disableAnimation: false,
    errors: {},
    history: {
      entries: [
        {
          type: "document",
          value: {
            document: JSON.parse(JSON.stringify(defaultDocument)),
          },
        },
      ],
      index: 0,
    },
    getImageBlock,
    selectedBlockId: null,
    selectedSlot: null,
    showBlocksPanel: false,
    selectedSidebarTab: "styles",
    selectedView: DEFAULT_VIEW,
    // selectedScreenSize: "original",
    selectedScreenSize: defaultScreenSize || DEFAULT_SCREEN_SIZE,
    fullScreen: false,
    indexes: initialIndexes,
    templateBlockIndexes: null,
    toggleInspectorDrawer: () => {},
    activeDragBlockId: null,
    activeDragBlockTemplate: null,
    activeOverBlockContextId: null,
    blockDisableOptions: {},
    allowedRules: {},
    actions: {
      setSelectedBlockId: (selectedBlockId: string | null) => {
        set({ selectedBlockId, selectedSlot: null });
      },
      setSelectedSlot: (selectedSlot: SelectedSlotRef | null) => {
        set({ selectedSlot, selectedBlockId: null });
      },
      setShowBlocksPanel: (showBlocksPanel: boolean) => {
        set({ showBlocksPanel });
      },
      toggleShowBlocksPanel: () => {
        set({ showBlocksPanel: !get().showBlocksPanel });
      },
      setSelectedSidebarTab: (
        selectedSidebarTab: "block-configuration" | "styles",
      ) => {
        set({ selectedSidebarTab });
      },
      setSelectedScreenSize: (selectedScreenSize: ViewportSize) => {
        set({ selectedScreenSize });
        persistScreenSize?.(selectedScreenSize);
      },
      setFullScreen: (fullScreen: boolean) => {
        set({ fullScreen });
      },
      toggleFullScreen: () => {
        set({ fullScreen: !get().fullScreen });
      },
      setSelectedView: (fn: (prev: View) => View) => {
        set({ selectedView: fn(get().selectedView) });
      },
      setToggleInspectorDrawer: (toggleInspectorDrawer: () => void) => {
        set({ toggleInspectorDrawer });
      },
      setDisableAnimation: (disableAnimation: boolean) => {
        set({ disableAnimation });
      },
      toggleDisableAnimation: () => {
        set({ disableAnimation: !get().disableAnimation });
      },
      setActiveDragBlockId: (
        activeDragBlockId: string | null,
        activeDragBlockTemplate?: TEditorBlock | null,
      ) => {
        set({
          activeDragBlockId,
          activeDragBlockTemplate: activeDragBlockTemplate || null,
          templateBlockIndexes:
            activeDragBlockId && activeDragBlockTemplate
              ? buildIndexes(activeDragBlockTemplate, get().schemas)
              : null,
        });
      },
      setActiveOverBlockContextId: (
        activeOverBlock: {
          blockId: string;
          property: string;
          index: number;
        } | null,
      ) => {
        if (!activeOverBlock) {
          set({ activeOverBlockContextId: null });
          return;
        }

        const currentDragBlockId = get().activeDragBlockId;
        if (!currentDragBlockId) {
          set({ activeOverBlockContextId: null });
          return;
        }

        const hierarchy = getBlockHierarchy(
          activeOverBlock.blockId,
          get().indexes,
        );

        if (hierarchy?.some((block) => block.id === currentDragBlockId)) {
          set({ activeOverBlockContextId: null });
          return;
        }

        set({
          activeOverBlockContextId: `${activeOverBlock?.blockId}/${activeOverBlock?.property}/${activeOverBlock?.index}`,
        });
      },
      setBlockDisableOptions: (
        blockId: string,
        options: BlockDisableOptions | undefined,
      ) => {
        set({
          blockDisableOptions: {
            ...get().blockDisableOptions,
            [blockId]: options,
          },
        });
      },
      setAllowedRule: (
        blockId: string,
        property: string,
        rule: BlockFilterRuleResult,
      ) => {
        set({
          allowedRules: {
            ...get().allowedRules,
            [`${blockId}/${property}`]: rule,
          },
        });
      },
      setDocument: (document: TEditorConfiguration) => {
        set({ document });
      },
      setOnChange: (onChange: (document: TEditorConfiguration) => void) => {
        set({ onChange });
      },
      setRootBlock: (rootBlock: TEditorBlock) => {
        set({ rootBlock });
      },
      setSchemas: (schemas: BuilderSchema) => {
        set({ schemas });
      },
      setErrors: (
        errors: Record<string, { type: string; error: z.ZodError }>,
      ) => {
        set({ errors });
      },
      setHistory: (history: EditorHistory) => {
        set({ history });
      },
      dispatch: (action: EditorHistoryEntry) => {
        const state = get();
        const { history, document, selectedBlockId, schemas, onChange } = state;

        let newAction = action;

        // Clone block is a special case, as we want to record new block with already regenerated ids
        // for undo and redo operations to make those ids consistent
        if (action.type === "clone-block") {
          const index = state.indexes[action.value.blockId];
          if (!index) return;

          newAction = {
            type: "add-block",
            value: {
              block: cloneBlock(index.block),
              parentBlockId: index.parentBlockId ?? state.rootBlock.id,
              parentBlockProperty: index.parentProperty ?? undefined,
              index: index.index ? index.index + 1 : "last",
            },
          };
        }

        // Update history entry if needed
        // if (
        //   history.entries.length > 0 &&
        //   history.index === 0 &&
        //   history.entries[0].type === "document" &&
        //   history.entries[0].value.document !== document
        // ) {
        //   history.entries[0].value.document = document;
        // }

        const result = editorHistoryReducer(
          document,
          selectedBlockId,
          newAction,
        );

        if (!result) return;

        const newHistoryEntries = [
          ...history.entries.slice(0, history.index + 1),
          newAction,
        ];

        const errors = validateStoreState(result.document, schemas);
        const newIndexes = buildIndexes(result.document, schemas);

        // Selective update to prevent unnecessary re-renders
        set({
          document: result.document,
          selectedBlockId: result.selectedBlockId,
          history: {
            entries: newHistoryEntries,
            index: newHistoryEntries.length - 1,
          },
          errors,
          indexes: newIndexes,
        });

        onChange?.(result.document);
      },
      resetDocument: (
        document?: EditorState["document"],
        onChange?: EditorState["onChange"],
      ) => {
        const newDocument = document || get().rootBlock;
        const newIndexes = buildIndexes(newDocument, schemas);

        set({
          document: newDocument,
          originalDocument: newDocument,
          onChange,
          errors: {},
          history: {
            entries: [
              {
                type: "document",
                value: {
                  document: JSON.parse(JSON.stringify(newDocument)),
                },
              },
            ],
            index: 0,
          },
          selectedSidebarTab: "styles",
          selectedBlockId: null,
          indexes: newIndexes,
        });
      },
      redoHistory: () => {
        const { document, history, selectedBlockId, schemas, onChange } = get();

        if (!canRedoHistory(history)) return;

        // We need to clone the original document to avoid mutating it
        const result = editorHistoryReducer(
          document,
          selectedBlockId,
          history.entries[history.index + 1],
        );

        if (!result) return;

        const errors = validateStoreState(result.document, schemas);
        const newIndexes = buildIndexes(result.document, schemas);

        set({
          document: result.document,
          selectedBlockId: result.selectedBlockId,
          history: {
            ...history,
            index: history.index + 1,
          },
          errors,
          indexes: newIndexes,
        });

        onChange?.(result.document);
      },
      undoHistory: () => {
        let { originalDocument, history, selectedBlockId, schemas, onChange } =
          get();

        if (!canUndoHistory(history)) return;

        // We need to clone the original document to avoid mutating it
        let document = JSON.parse(JSON.stringify(originalDocument));

        for (let i = 0; i < history.index; i++) {
          const result = editorHistoryReducer(
            document,
            selectedBlockId,
            history.entries[i],
          );

          if (!result) return;

          document = result.document;
          selectedBlockId = result.selectedBlockId;
        }

        const errors = validateStoreState(document, schemas);
        const newIndexes = buildIndexes(document, schemas);

        set({
          document,
          selectedBlockId,
          history: {
            ...history,
            index: history.index - 1,
          },
          errors,
          indexes: newIndexes,
        });

        onChange?.(document);
      },
    },
  }));
};

export function useDeep<S, U>(selector: (state: S) => U): (state: S) => U {
  const prev = useRef<U>(undefined);
  return (state) => {
    const next = selector(state);
    return deepEqual(prev.current, next)
      ? (prev.current as U)
      : (prev.current = next);
  };
}

function validateStoreState(
  document: EditorState["document"],
  schemas: BuilderSchema,
) {
  return validateBlocks(document, schemas);
}

function buildIndexes(
  document: EditorState["document"],
  schemas: BuilderSchema,
) {
  const indexes: EditorState["indexes"] = {};

  // Helper function to recursively strip children from any object
  const stripChildrenRecursively = (obj: any): any => {
    if (!obj || typeof obj !== "object") return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => stripChildrenRecursively(item));
    }

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Only remove 'children' properties that contain an array of blocks
      if (key === "children" && Array.isArray(value)) {
        // Check if this array contains blocks (objects with 'id' and 'type' properties)
        const containsBlocks = value.some(
          (item) =>
            item &&
            typeof item === "object" &&
            "id" in item &&
            item.id &&
            "type" in item &&
            item.type &&
            // Check if the type is a known block type from schemas
            schemas[item.type],
        );
        if (containsBlocks) {
          continue; // Skip this children property
        }
      }

      // Recursively process nested objects and arrays
      if (value && typeof value === "object") {
        result[key] = stripChildrenRecursively(value);
      } else {
        result[key] = value;
      }
    }

    return result;
  };

  const extractIndexes = (
    block: any,
    parentBlockId: string | null,
    parentProperty: string | null,
    index: number,
    depth: number,
    currentPath: string = "",
  ) => {
    if (!block || typeof block !== "object" || !("id" in block) || !block.id)
      return;

    // Add current block to indexes
    indexes[block.id] = {
      block,
      noChildrenBlock: {
        ...block,
        data: stripChildrenRecursively(block.data),
      },
      blockType: block.type,
      parentBlockId,
      parentProperty,
      index,
      depth,
      childrenBlockIds: {},
    };

    // Traverse through block properties to find children
    for (const [prop, value] of Object.entries(block)) {
      if (prop === "children" && Array.isArray(value)) {
        // Handle children array
        const childBlockIds: string[] = [];
        value.forEach((child: any, childIndex: number) => {
          if (child && typeof child === "object" && "id" in child && child.id) {
            childBlockIds.push(child.id);
            // For children arrays, the parentProperty should be the current path without 'children'
            const parentProperty = currentPath === "data" ? "" : currentPath;
            extractIndexes(
              child,
              block.id,
              parentProperty,
              childIndex,
              depth + 1,
              currentPath,
            );
          }
        });
        if (childBlockIds.length > 0) {
          // Use the clean property path (without 'data' and 'children') as the key
          const cleanPropertyPath = currentPath === "data" ? "" : currentPath;
          indexes[block.id].childrenBlockIds[cleanPropertyPath] = childBlockIds;
        }
      } else if (prop === "data" && value && typeof value === "object") {
        // Traverse through data object to find nested blocks
        traverseDataObject(value, block.id, "data", depth, block.id);
      }
    }
  };

  const traverseDataObject = (
    data: any,
    parentBlockId: string,
    currentPath: string,
    depth: number,
    blockId: string,
  ) => {
    if (!data || typeof data !== "object") return;

    for (const [prop, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        // Handle arrays that might contain blocks
        const childBlockIds: string[] = [];
        value.forEach((item: any, index: number) => {
          if (isSlotLikeObject(item)) {
            const childrenPath = buildNextPath(
              currentPath,
              prop,
              index.toString(),
              "children",
            );
            let parentProperty = childrenPath;
            if (parentProperty.startsWith("data.")) {
              parentProperty = parentProperty.slice(5);
            }
            const slotChildIds: string[] = [];
            item.children.forEach((child: any, childIndex: number) => {
              if (isEditorBlockLike(child)) {
                slotChildIds.push(child.id);
                extractIndexes(
                  child,
                  parentBlockId,
                  parentProperty,
                  childIndex,
                  depth + 1,
                  childrenPath,
                );
              }
            });
            if (slotChildIds.length > 0) {
              indexes[blockId].childrenBlockIds[parentProperty] = slotChildIds;
            }
          } else if (
            item &&
            typeof item === "object" &&
            "id" in item &&
            item.id &&
            "type" in item &&
            item.type
          ) {
            // This is a block - build the parentProperty path
            const parentProperty = buildParentPropertyPath(currentPath, prop);
            childBlockIds.push(item.id);
            extractIndexes(
              item,
              parentBlockId,
              parentProperty,
              index,
              depth,
              currentPath,
            );
          } else if (item && typeof item === "object") {
            // This might be an object containing blocks
            const newPath = buildNextPath(currentPath, prop, index.toString());
            traverseDataObject(item, parentBlockId, newPath, depth, blockId);
          }
        });
        if (childBlockIds.length > 0) {
          const parentProperty = buildParentPropertyPath(currentPath, prop);
          indexes[blockId].childrenBlockIds[parentProperty] = childBlockIds;
        }
        // } else if (
        //   isSlotLikeObject(value) &&
        //   !isBlockRootPropsKey(currentPath, prop)
        // ) {
        //   let parentProperty = buildNextPath(currentPath, prop, "children");
        //   if (parentProperty.startsWith("data.")) {
        //     parentProperty = parentProperty.slice(5);
        //   }
        //   const slotChildIds: string[] = [];
        //   value.children.forEach((child: any, childIndex: number) => {
        //     if (isEditorBlockLike(child)) {
        //       slotChildIds.push(child.id);
        //       extractIndexes(
        //         child,
        //         parentBlockId,
        //         parentProperty,
        //         childIndex,
        //         depth + 1,
        //         parentProperty,
        //       );
        //     }
        //   });
        //   if (slotChildIds.length > 0) {
        //     indexes[blockId].childrenBlockIds[parentProperty] = slotChildIds;
        //   }
      } else if (
        value &&
        typeof value === "object" &&
        "id" in value &&
        value.id &&
        "type" in value &&
        (value as { type: string }).type
      ) {
        // This is a direct block - build the parentProperty path
        const parentProperty = buildParentPropertyPath(currentPath, prop);
        // Use the clean property path as the key
        indexes[blockId].childrenBlockIds[parentProperty] = [String(value.id)];
        extractIndexes(
          value,
          parentBlockId,
          parentProperty,
          0,
          depth,
          currentPath,
        );
      } else if (value && typeof value === "object") {
        // This might be an object containing blocks
        const newPath = buildNextPath(currentPath, prop);
        traverseDataObject(value, parentBlockId, newPath, depth, blockId);
      }
    }
  };

  const buildNextPath = (currentPath: string, ...props: string[]): string => {
    // If we're at the root 'data' level, start with the current property
    if (currentPath === "data") {
      return props.join(".");
    }
    // Otherwise, append the property to the existing path
    return `${currentPath}.${props.join(".")}`;
  };

  const buildParentPropertyPath = (
    currentPath: string,
    prop: string,
  ): string => {
    // Build the full path first
    let path = buildNextPath(currentPath, prop);

    // Remove 'children' from the end if it exists
    if (path.endsWith(".children")) {
      path = path.slice(0, -9); // Remove '.children'
    } else if (path === "children") {
      // For the root 'children' property, it's a special case
      path = "";
    }

    return path;
  };

  // Start with the root document
  extractIndexes(document, null, null, 0, 0, "");

  return indexes;
}

export type EditorStateStore = ReturnType<typeof createEditorStateStore>;

const EditorStateContext = createContext<UseBoundStore<
  StoreApi<EditorState>
> | null>(null);

export const EditorStateProvider: FC<
  PropsWithChildren<{
    blocks: EditorDocumentBlocksDictionary<any>;
    readerBlocks: ReaderDocumentBlocksDictionary<any>;
    templates?: TemplatesConfiguration;
    rootBlock: TEditorBlock;
    document?: TEditorConfiguration;
    schemas: BuilderSchema;
    getImageBlock?: (file: UploadedFile) => TEditorBlock;
  }>
> = ({ children, ...props }) => {
  const storeRef = useRef<EditorStateStore | null>(null);
  const [cookies, setCookies] = useCookies([SCREEN_SIZE_STORAGE_KEY]);

  if (!storeRef.current) {
    storeRef.current = createEditorStateStore({
      ...props,
      defaultScreenSize: cookies[SCREEN_SIZE_STORAGE_KEY],
      persistScreenSize: (screenSize) => {
        setCookies(SCREEN_SIZE_STORAGE_KEY, screenSize);
      },
      getImageBlock: props.getImageBlock,
    });
  }

  return (
    <EditorStateContext.Provider value={storeRef.current}>
      {children}
    </EditorStateContext.Provider>
  );
};

export const useEditorStateStore = () => {
  const store = useContext(EditorStateContext);
  if (!store)
    throw new Error("Missing EditorStateContext.Provider in the tree");

  return store;
};

export const useEditorStore = () => {
  const store = useEditorStateStore();
  return useStore(store);
};

// Memoized selectors to prevent unnecessary re-renders
export function useDocument() {
  const store = useEditorStateStore();
  return useStore(
    store,
    useDeep((s) => s.document),
  );
}

export function useBlocks() {
  const store = useEditorStateStore();
  return useStore(
    store,
    useDeep((s) => s.blocks),
  );
}

export function useTemplates() {
  const store = useEditorStateStore();
  return useStore(
    store,
    useDeep((s) => s.templates),
  );
}

export function useBlockSchema(blockId: string) {
  const store = useEditorStateStore();
  return useStore(
    store,
    useDeep((s) => {
      const blockType = s.indexes[blockId]?.blockType;
      return blockType && s.blocks[blockType]
        ? {
            type: blockType,
            schema: s.blocks[blockType],
          }
        : null;
    }),
  );
}

export function useBlockTypes() {
  const store = useEditorStateStore();
  return useStore(
    store,
    useDeep((s) => Object.keys(s.schemas)),
  );
}

export function useReaderBlocks() {
  const store = useEditorStateStore();
  return useStore(
    store,
    useDeep((s) => s.readerBlocks),
  );
}

export function useRootBlock() {
  const store = useEditorStateStore();
  return useStore(
    store,
    useDeep((s) => s.indexes[s.document.id]?.noChildrenBlock),
  );
}

export function useRootBlockType() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.document.type);
}

export function useRootBlockId() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.document.id);
}

export function useSelectedBlockId() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.selectedBlockId);
}

/** Parent block id when inspecting a block or an embedded slot on that block. */
export function useInspectBlockId() {
  const selectedBlockId = useSelectedBlockId();
  const selectedSlot = useSelectedSlot();
  return selectedBlockId ?? selectedSlot?.blockId ?? null;
}

export function useSelectedSlot() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.selectedSlot);
}

export function useSetSelectedSlot() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.actions.setSelectedSlot);
}

export function useSelectedBlockType() {
  const store = useEditorStateStore();
  return useStore(store, (s) =>
    s.selectedBlockId ? s.indexes[s.selectedBlockId]?.block.type : null,
  );
}

export function useIsSelectedBlock(blockId: string) {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.selectedBlockId === blockId);
}

export function useSelectedBlock() {
  const store = useEditorStateStore();
  return useStore(
    store,
    useDeep((s) =>
      s.selectedBlockId
        ? s.indexes[s.selectedBlockId]?.noChildrenBlock || null
        : null,
    ),
  );
}

export function useSelectedScreenSize() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.selectedScreenSize);
}

export function useShowBlocksPanel() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.showBlocksPanel);
}

export function useSetShowBlocksPanel() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.actions.setShowBlocksPanel);
}

export function useToggleShowBlocksPanel() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.actions.toggleShowBlocksPanel);
}

export function useSelectedSidebarTab() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.selectedSidebarTab);
}

export function useFullScreen() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.fullScreen);
}

export function useHasActiveDragBlock() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.activeDragBlockId !== null);
}

export function useIsActiveDragBlock(blockId: string) {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.activeDragBlockId === blockId);
}

export function useActiveDragBlock() {
  const store = useEditorStateStore();
  return useStore(
    store,
    useDeep((s) =>
      s.activeDragBlockId
        ? s.activeDragBlockTemplate
          ? {
              block: s.activeDragBlockTemplate,
              blockId: s.activeDragBlockId,
              parentBlockId: null,
              parentProperty: null,
              index: null,
              isTemplate: true,
            }
          : s.indexes[s.activeDragBlockId]
            ? {
                ...s.indexes[s.activeDragBlockId],
                blockId: s.activeDragBlockId,
                isTemplate: false,
              }
            : null
        : null,
    ),
  );
}

export function useBlockDisableOptions(
  blockId: string | undefined | null,
): BlockDisableOptions | undefined {
  const store = useEditorStateStore();
  return useStore(
    store,
    useDeep((s) => (blockId ? s.blockDisableOptions[blockId] : undefined)),
  );
}

// Stable function references to prevent re-renders
export function useSetBlockDisableOptions() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.actions.setBlockDisableOptions);
}

export function useAllowedRule(
  blockId: string | undefined | null,
  property: string | undefined | null,
): BlockFilterRuleResult | undefined {
  const store = useEditorStateStore();
  return useStore(
    store,
    useDeep((s) =>
      blockId ? s.allowedRules[`${blockId}/${property ?? ""}`] : undefined,
    ),
  );
}

export function useSetAllowedRule() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.actions.setAllowedRule);
}

export function useSetActiveDragBlockId() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.actions.setActiveDragBlockId);
}

export function getActiveOverBlockContext(store: EditorState) {
  if (!store.activeOverBlockContextId) return null;
  const [blockId, property, index] = store.activeOverBlockContextId.split("/");
  const block = store.indexes[blockId];
  return block
    ? {
        blockId,
        property,
        contextId: store.activeOverBlockContextId,
        index: parseInt(index),
      }
    : null;
}

export function useActiveOverBlock() {
  const store = useEditorStateStore();
  return useStore(
    store,
    useDeep((s) => {
      return getActiveOverBlockContext(s);
    }),
  );
}

export function useIsActiveOverDroppable(
  blockId: string,
  property: string,
  index: number,
) {
  const store = useEditorStateStore();
  return useStore(
    store,
    useDeep((s) => {
      if (!s.activeOverBlockContextId) return false;
      const [overBlockId, overProperty, overIndex] =
        s.activeOverBlockContextId.split("/");
      return (
        overBlockId === blockId &&
        overProperty === property &&
        parseInt(overIndex) === index
      );
    }),
  );
}

export function useIsActiveHierarchyOverDroppable(blockId: string) {
  const store = useEditorStateStore();
  return useStore(store, (s) => {
    if (!s.activeOverBlockContextId) return false;
    const [overBlockId] = s.activeOverBlockContextId.split("/");

    const hierarchy = getBlockHierarchy(overBlockId, s.indexes);
    return hierarchy?.some((block) => block.id === blockId);
  });
}

export function useChildrenBlocksIds(blockId: string, property: string) {
  const store = useEditorStateStore();
  return useStore(
    store,
    useDeep((s) => {
      const block = s.indexes[blockId] ?? s.templateBlockIndexes?.[blockId];
      return block ? block.childrenBlockIds[property] || [] : [];
    }),
  );
}

export function useBlockChildrenBlockIds(blockId: string, property: string) {
  const store = useEditorStateStore();
  return useStore(
    store,
    useDeep((s) => {
      const block = s.indexes[blockId] ?? s.templateBlockIndexes?.[blockId];
      return block ? block.childrenBlockIds[property] || [] : [];
    }),
  );
}

export function useSetActiveOverBlockContextId() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.actions.setActiveOverBlockContextId);
}

export function useSetSelectedBlockId() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.actions.setSelectedBlockId);
}

export function useSetSidebarTab() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.actions.setSelectedSidebarTab);
}

export function useResetDocument() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.actions.resetDocument);
}

// Optimized action dispatcher with memoized state access
export function useDispatchAction() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.actions.dispatch);
}

export function canUndoHistory(history: EditorState["history"]) {
  return history.index > 0;
}

export function canRedoHistory(history: EditorState["history"]) {
  return history.index < history.entries.length - 1;
}

export function useCanUndoHistory() {
  const store = useEditorStateStore();
  return useStore(store, (s) => canUndoHistory(s.history));
}

export function useCanRedoHistory() {
  const store = useEditorStateStore();
  return useStore(store, (s) => canRedoHistory(s.history));
}

export function useUndoHistory() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.actions.undoHistory);
}

export function useRedoHistory() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.actions.redoHistory);
}

export function useEditorStateErrors() {
  const store = useEditorStateStore();
  return useStore(
    store,
    useDeep((s) => s.errors),
  );
}

export function useSelectedView() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.selectedView);
}

export function useSetSelectedView() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.actions.setSelectedView);
}

export function useToggleInspectorDrawer() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.toggleInspectorDrawer);
}

export function useSetToggleInspectorDrawer() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.actions.setToggleInspectorDrawer);
}

export function useSetSelectedScreenSize() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.actions.setSelectedScreenSize);
}

export function useToggleFullScreen() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.actions.toggleFullScreen);
}

export function useDisableAnimation() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.disableAnimation);
}

export function useSetDisableAnimation() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.actions.setDisableAnimation);
}

export function useToggleDisableAnimation() {
  const store = useEditorStateStore();
  return useStore(store, (s) => s.actions.toggleDisableAnimation);
}

// Optimized block selection hook
export function useBlock(blockId: string | null) {
  const store = useEditorStateStore();
  return useStore(
    store,
    useDeep((s) => {
      if (!blockId) return null;
      return (
        (s.indexes[blockId] ?? s.templateBlockIndexes?.[blockId])
          ?.noChildrenBlock || null
      );
    }),
  );
}

/** Full document block (includes nested children). Use for structural prop edits. */
export function useDocumentBlock(blockId: string | null) {
  const store = useEditorStateStore();
  return useStore(
    store,
    useDeep((s) => {
      if (!blockId) return null;
      return (
        (s.indexes[blockId] ?? s.templateBlockIndexes?.[blockId])?.block || null
      );
    }),
  );
}

export function useBlockType(blockId: string | null) {
  const store = useEditorStateStore();
  return useStore(store, (s) => {
    if (!blockId) return null;
    return (
      (s.indexes[blockId] ?? s.templateBlockIndexes?.[blockId])?.blockType ||
      null
    );
  });
}

export function useBlockDefinition(blockId: string | null) {
  const store = useEditorStateStore();
  return useStore(
    store,
    useDeep((s) => {
      if (!blockId) return null;
      const type = (s.indexes[blockId] ?? s.templateBlockIndexes?.[blockId])
        ?.blockType;
      if (!type) return null;

      const block = s.blocks[type];
      if (!block) return null;

      return {
        type,
        capabilities: block.capabilities,
        tags: block.tags,
        allowedIn: block.allowedIn,
      };
    }),
  );
}

export function useBlocksDefinitions() {
  const store = useEditorStateStore();
  return useStore(
    store,
    useDeep((s) => {
      return Object.entries(s.blocks).map(([type, block]) => ({
        type,
        capabilities: block.capabilities,
        tags: block.tags,
        allowedIn: block.allowedIn,
      }));
    }),
  );
}

export function useBlockAllowedParentTypes(blockId: string | null) {
  const store = useEditorStateStore();
  return useStore(store, (s) => {
    if (!blockId) return null;
    const blockType = (s.indexes[blockId] ?? s.templateBlockIndexes?.[blockId])
      ?.blockType;
    if (!blockType) return null;
    return s.blocks[blockType]?.allowedIn || null;
  });
}

export function useBlockIndex(blockId: string | null) {
  const store = useEditorStateStore();
  return useStore(store, (s) => {
    if (!blockId) return null;
    return (s.indexes[blockId] ?? s.templateBlockIndexes?.[blockId])?.index;
  });
}

export function useBlockParentData(blockId: string | null) {
  const store = useEditorStateStore();
  return useStore(
    store,
    useDeep((s) => {
      if (!blockId) return null;
      const data = s.indexes[blockId] ?? s.templateBlockIndexes?.[blockId];
      return data
        ? {
            parentBlockId: data.parentBlockId,
            parentProperty: data.parentProperty,
            index: data.index,
            depth: data.depth,
            parentBlockType: data.parentBlockId
              ? s.indexes[data.parentBlockId]?.blockType
              : null,
          }
        : null;
    }),
  );
}

export function useBlockDepth(blockId: string | null) {
  const store = useEditorStateStore();
  return useStore(store, (s) => {
    if (!blockId) return null;
    return (s.indexes[blockId] ?? s.templateBlockIndexes?.[blockId])?.depth;
  });
}

export function getBlockHierarchy(
  blockId: string | null,
  indexes: EditorState["indexes"],
) {
  if (!blockId) return null;
  const hierarchy = [];
  let currentBlock: {
    block: TEditorBlock;
    parentBlockId: string | null;
    parentProperty: string | null;
  } | null = indexes[blockId];
  while (currentBlock) {
    const blockData =
      indexes[currentBlock.block.id] ?? indexes[currentBlock.block.id];
    if (blockData) {
      hierarchy.push({
        id: blockData.block.id,
        type: blockData.blockType,
      });
    }
    currentBlock = currentBlock.parentBlockId
      ? indexes[currentBlock.parentBlockId]
      : null;
  }
  return hierarchy.reverse();
}

export function useBlockHierarchy(blockId: string | null) {
  const store = useEditorStateStore();
  return useStore(
    store,
    useDeep((s) => {
      return getBlockHierarchy(blockId, s.indexes);
    }),
  );
}

// Optimized block parent hook
export function useBlockParent(blockId: string | null) {
  const store = useEditorStateStore();
  return useStore(
    store,
    useDeep((s) => {
      if (!blockId) return null;
      const parentId = (s.indexes[blockId] ?? s.templateBlockIndexes?.[blockId])
        ?.parentBlockId;
      return parentId
        ? (s.indexes[parentId] ?? s.templateBlockIndexes?.[parentId])
            ?.noChildrenBlock || null
        : null;
    }),
  );
}

// Optimized block children hook
export function useBlockChildrenIds(blockId: string | null) {
  const store = useEditorStateStore();
  return useStore(
    store,
    useDeep((s) => {
      if (!blockId) return null;
      const block = s.indexes[blockId] ?? s.templateBlockIndexes?.[blockId];
      if (!block) return null;

      return block.childrenBlockIds;
    }),
  );
}

export function useBlockEditorDisableOptions(blockId: string | null) {
  const store = useEditorStateStore();
  return useStore(
    store,
    useDeep((s) => {
      if (!blockId) return null;
      const blockType = s.indexes[blockId]?.blockType;
      if (!blockType) return null;
      return s.blocks[blockType]?.disable;
    }),
  );
}

export const EditorArgsContext = createContext<Record<string, any>>({});
export function useEditorArgs() {
  return useContext(EditorArgsContext);
}
