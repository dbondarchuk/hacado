"use client";

import { useEffect } from "react";
import {
  useHasActiveDragBlock,
  useSetDragIntoNestedModifier,
} from "../../documents/editor/context";
import { usePortalContext } from "../template-panel/portal-context";

function readNestedModifier(event: KeyboardEvent | PointerEvent | MouseEvent) {
  return event.ctrlKey || event.metaKey;
}

export function syncDragIntoNestedModifier(
  event: KeyboardEvent | PointerEvent | MouseEvent | null | undefined,
  setDragIntoNestedModifier: (value: boolean) => void,
) {
  if (!event) return;
  setDragIntoNestedModifier(readNestedModifier(event));
}

export function DragIntoNestedModifierTracker() {
  const hasActiveDragBlock = useHasActiveDragBlock();
  const setDragIntoNestedModifier = useSetDragIntoNestedModifier();
  const { document: portalDocument } = usePortalContext();

  useEffect(() => {
    if (!hasActiveDragBlock) {
      setDragIntoNestedModifier(false);
      return;
    }

    const views = new Set<Window>();
    if (typeof window !== "undefined") {
      views.add(window);
    }
    const portalView = portalDocument.defaultView;
    if (portalView) {
      views.add(portalView);
    }

    const update = (event: KeyboardEvent | PointerEvent) => {
      setDragIntoNestedModifier(readNestedModifier(event));
    };

    const reset = () => {
      setDragIntoNestedModifier(false);
    };

    for (const view of views) {
      view.addEventListener("keydown", update);
      view.addEventListener("keyup", update);
      view.addEventListener("pointermove", update);
      view.addEventListener("blur", reset);
    }

    return () => {
      for (const view of views) {
        view.removeEventListener("keydown", update);
        view.removeEventListener("keyup", update);
        view.removeEventListener("pointermove", update);
        view.removeEventListener("blur", reset);
      }
      setDragIntoNestedModifier(false);
    };
  }, [hasActiveDragBlock, portalDocument, setDragIntoNestedModifier]);

  return null;
}
