import { debounce } from "@hacado/types";
import { create } from "zustand";
import type { Canvas, Design, Element } from "./types";

interface EditorState {
  design: Design;
  selectedElements: string[];
  zoom: number;
  pan: { x: number; y: number };
  mode: "edit" | "preview";
  history: Design[];
  historyIndex: number;
  uiTheme: "light" | "dark";
  clipboard: Element | null;
  clipboardMultiple: Element[];
  disabled: boolean;

  // Canvas actions
  setCanvas: (canvas: Partial<Canvas>) => void;

  // Element actions
  addElement: (element: Element) => void;
  updateElement: (id: string, updates: Partial<Element>) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  reorderElement: (id: string, newIndex: number) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  groupElements: (ids: string[]) => void;
  ungroupElements: (groupId: string) => void;

  // Selection actions
  selectElement: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  toggleSelection: (id: string) => void;
  selectMultiple: (ids: string[]) => void;
  copyElement: (id: string) => void;
  pasteElement: () => void;
  copySelectedElements: () => void;
  pasteElements: () => void;

  // View actions
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setMode: (mode: "edit" | "preview") => void;
  setUiTheme: (theme: "light" | "dark") => void;

  // History actions
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
}

const initialCanvas: Canvas = {
  width: 1200,
  height: 800,
  aspectRatio: "3:2",
  theme: "light", // Default theme is light
};

export const initialDesign: Design = {
  canvas: initialCanvas,
  elements: [],
};

/** Default design value for new designs (schema-compliant). */
export function getDefaultDesign(): Design {
  return { ...initialDesign, canvas: { ...initialCanvas }, elements: [] };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  design: initialDesign,
  selectedElements: [],
  zoom: 1,
  pan: { x: 0, y: 0 },
  mode: "edit",
  history: [initialDesign],
  historyIndex: 0,
  uiTheme: "dark",
  clipboard: null,
  clipboardMultiple: [],
  disabled: false,
  setCanvas: (canvas) => {
    set((state) => ({
      design: {
        ...state.design,
        canvas: { ...state.design.canvas, ...canvas },
      },
    }));
    get().pushHistory();
  },

  addElement: (element) => {
    set((state) => ({
      design: {
        ...state.design,
        elements: [...state.design.elements, element],
      },
    }));
    get().pushHistory();
  },

  updateElement: (id, updates) => {
    set((state) => ({
      design: {
        ...state.design,
        elements: state.design.elements.map((el) =>
          el.id === id ? ({ ...el, ...updates } as Element) : el,
        ),
      },
    }));
    get().pushHistory();
  },

  deleteElement: (id) => {
    const element = get().design.elements.find((el) => el.id === id);

    set((state) => ({
      design: {
        ...state.design,
        elements: state.design.elements.filter((el) => el.id !== id),
      },
      selectedElements: state.selectedElements.filter((selId) => selId !== id),
    }));
    get().pushHistory();
  },

  duplicateElement: (id) => {
    const element = get().design.elements.find((el) => el.id === id);
    if (!element) return;

    const newElement = {
      ...element,
      id: `element-${Date.now()}`,
      position: {
        x: element.position.x + 20,
        y: element.position.y + 20,
      },
    };

    get().addElement(newElement);
  },

  reorderElement: (id, newIndex) => {
    set((state) => {
      const elements = [...state.design.elements];
      const currentIndex = elements.findIndex((el) => el.id === id);
      if (currentIndex === -1) return state;

      const [element] = elements.splice(currentIndex, 1);
      elements.splice(newIndex, 0, element);

      return {
        design: {
          ...state.design,
          elements,
        },
      };
    });
    get().pushHistory();
  },

  bringToFront: (id) => {
    set((state) => {
      const elements = [...state.design.elements];
      const index = elements.findIndex((el) => el.id === id);
      if (index === -1 || index === elements.length - 1) return state;

      const [element] = elements.splice(index, 1);
      elements.push(element);

      return {
        design: {
          ...state.design,
          elements,
        },
      };
    });
    get().pushHistory();
  },

  sendToBack: (id) => {
    set((state) => {
      const elements = [...state.design.elements];
      const index = elements.findIndex((el) => el.id === id);
      if (index === -1 || index === 0) return state;

      const [element] = elements.splice(index, 1);
      elements.unshift(element);

      return {
        design: {
          ...state.design,
          elements,
        },
      };
    });
    get().pushHistory();
  },

  groupElements: (ids) => {
    if (ids.length < 2) return;

    set((state) => {
      // Flatten any selected groups: ungroup them and collect their children
      // with absolute positions restored before computing the new bounding box.
      const flattenedIds: string[] = [];
      const groupsToRemove: string[] = [];

      // First pass: collect element list with absolute positions
      // (children of groups currently hold relative positions)
      const absoluteElements: Array<{
        id: string;
        absX: number;
        absY: number;
      }> = [];

      ids.forEach((id) => {
        const el = state.design.elements.find((e) => e.id === id);
        if (!el) return;
        if (el.type === "group") {
          const groupEl = el as any;
          groupsToRemove.push(id);
          groupEl.children?.forEach((childId: string) => {
            const child = state.design.elements.find((e) => e.id === childId);
            if (!child) return;
            flattenedIds.push(childId);
            absoluteElements.push({
              id: childId,
              absX: child.position.x + el.position.x,
              absY: child.position.y + el.position.y,
            });
          });
        } else {
          flattenedIds.push(id);
          absoluteElements.push({
            id,
            absX: el.position.x,
            absY: el.position.y,
          });
        }
      });

      if (flattenedIds.length < 2) return state;

      // Bounding box in absolute coordinates
      let minX = Number.POSITIVE_INFINITY,
        minY = Number.POSITIVE_INFINITY,
        maxX = Number.NEGATIVE_INFINITY,
        maxY = Number.NEGATIVE_INFINITY;

      absoluteElements.forEach(({ id, absX, absY }) => {
        const el = state.design.elements.find((e) => e.id === id);
        if (!el) return;
        minX = Math.min(minX, absX);
        minY = Math.min(minY, absY);
        maxX = Math.max(maxX, absX + el.size.width);
        maxY = Math.max(maxY, absY + el.size.height);
      });

      const groupId = `group-${Date.now()}`;
      const group: any = {
        id: groupId,
        type: "group",
        position: { x: minX, y: minY },
        size: { width: maxX - minX, height: maxY - minY },
        rotation: 0,
        opacity: 1,
        visible: true,
        children: flattenedIds,
      };

      // Rebuild element list: remove old groups, update child positions to be
      // relative to the new group origin
      const updatedElements = state.design.elements
        .filter((el) => !groupsToRemove.includes(el.id))
        .map((el) => {
          const abs = absoluteElements.find((a) => a.id === el.id);
          if (abs) {
            return {
              ...el,
              position: { x: abs.absX - minX, y: abs.absY - minY },
            };
          }
          return el;
        });

      return {
        design: {
          ...state.design,
          elements: [...updatedElements, group],
        },
        selectedElements: [groupId],
      };
    });
    get().pushHistory();
  },

  ungroupElements: (groupId) => {
    set((state) => {
      const group = state.design.elements.find((el) => el.id === groupId);
      if (!group || group.type !== "group") return state;

      const groupElement = group as any;
      const groupRad = (groupElement.rotation * Math.PI) / 180;
      const cos = Math.cos(groupRad);
      const sin = Math.sin(groupRad);
      const gx = groupElement.position.x;
      const gy = groupElement.position.y;

      // Convert each child from group-relative coords to absolute canvas coords,
      // and accumulate the group's rotation into the child's own rotation.
      const updatedElements = state.design.elements
        .map((el) => {
          if (groupElement.children.includes(el.id)) {
            // Rotate the child's relative position vector by the group rotation
            const rx = el.position.x * cos - el.position.y * sin;
            const ry = el.position.x * sin + el.position.y * cos;
            return {
              ...el,
              position: { x: gx + rx, y: gy + ry },
              rotation: (el.rotation + groupElement.rotation) % 360,
            };
          }
          return el;
        })
        .filter((el) => el.id !== groupId);

      return {
        design: {
          ...state.design,
          elements: updatedElements,
        },
        selectedElements: groupElement.children,
      };
    });
    get().pushHistory();
  },

  selectElement: (id, multi = false) => {
    set((state) => {
      // Check if element is part of a group
      const groups = state.design.elements.filter(
        (el) => el.type === "group",
      ) as any[];
      const parentGroup = groups.find((g) => g.children?.includes(id));

      // If element is in a group, select the group instead
      const targetId = parentGroup ? parentGroup.id : id;

      if (multi) {
        const isSelected = state.selectedElements.includes(targetId);
        return {
          selectedElements: isSelected
            ? state.selectedElements.filter((selId) => selId !== targetId)
            : [...state.selectedElements, targetId],
        };
      }
      return { selectedElements: [targetId] };
    });
  },

  clearSelection: () => {
    set({ selectedElements: [] });
  },

  toggleSelection: (id) => {
    set((state) => {
      const isSelected = state.selectedElements.includes(id);
      return {
        selectedElements: isSelected
          ? state.selectedElements.filter((selId) => selId !== id)
          : [...state.selectedElements, id],
      };
    });
  },

  selectMultiple: (ids) => {
    set({ selectedElements: ids });
  },

  copyElement: (id) => {
    const element = get().design.elements.find((el) => el.id === id);
    if (element) {
      set({ clipboard: element });
    }
  },

  pasteElement: () => {
    const state = get();
    if (state.clipboard) {
      const newElement = {
        ...state.clipboard,
        id: `element-${Date.now()}`,
        position: {
          x: state.clipboard.position.x + 20,
          y: state.clipboard.position.y + 20,
        },
      };
      get().addElement(newElement);
      set({ selectedElements: [newElement.id] });
    }
  },

  copySelectedElements: () => {
    const state = get();
    const elements = state.design.elements.filter((el) =>
      state.selectedElements.includes(el.id),
    );
    if (elements.length > 0) {
      set({ clipboardMultiple: elements });
    }
  },

  pasteElements: () => {
    const state = get();
    if (state.clipboardMultiple && state.clipboardMultiple.length > 0) {
      const newIds: string[] = [];
      state.clipboardMultiple.forEach((element: Element) => {
        const newElement = {
          ...element,
          id: `element-${Date.now()}-${Math.random()}`,
          position: {
            x: element.position.x + 20,
            y: element.position.y + 20,
          },
        };
        get().addElement(newElement);
        newIds.push(newElement.id);
      });
      set({ selectedElements: newIds });
    }
  },

  setZoom: (zoom) => {
    set({ zoom: Math.max(0.1, Math.min(5, zoom)) });
  },

  setPan: (pan) => {
    set({ pan });
  },

  setMode: (mode) => {
    set({ mode });
  },

  setUiTheme: (theme) => {
    set({ uiTheme: theme });
  },

  undo: () => {
    set((state) => {
      if (state.historyIndex > 0) {
        return {
          historyIndex: state.historyIndex - 1,
          design: state.history[state.historyIndex - 1],
        };
      }
      return state;
    });
  },

  redo: () => {
    set((state) => {
      if (state.historyIndex < state.history.length - 1) {
        return {
          historyIndex: state.historyIndex + 1,
          design: state.history[state.historyIndex + 1],
        };
      }
      return state;
    });
  },

  pushHistory: debounce(() => {
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(state.design);

      // Keep only last 50 states
      if (newHistory.length > 50) {
        newHistory.shift();
        return {
          history: newHistory,
          historyIndex: newHistory.length - 1,
        };
      }

      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, 300),
}));
