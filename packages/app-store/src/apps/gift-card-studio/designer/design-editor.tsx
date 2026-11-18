"use client";

import { useEffect } from "react";
import { EditorLayout } from "./editor/editor-layout";
import { designSchema } from "./lib/schema";
import {
  getDefaultDesign as getDefaultDesignFromStore,
  useEditorStore,
} from "./lib/store";
import type { Design } from "./lib/types";

/** Re-export for convenience so the form can import from one place. */
export const getDefaultDesign = getDefaultDesignFromStore;

export interface DesignEditorProps {
  /** Connected app id for Gift Card Studio AI process calls. */
  appId: string;
  /** Design ID when editing an existing design; undefined for new design. Used to sync store when switching designs. */
  designId?: string;
  /** Initial design to load into the editor (e.g. from initialData.design or getDefaultDesign()). */
  initialDesign: Design;
  /** Whether the editor is disabled. */
  disabled?: boolean;
}

/**
 * Wraps the gift card designer editor: hydrates the editor store with initialDesign
 * and renders the full editor layout. The parent form should read the current
 * design from the store on submit via getDesignFromStore().
 */
export function DesignEditor({
  appId,
  designId,
  initialDesign,
  disabled,
}: DesignEditorProps) {
  useEffect(() => {
    useEditorStore.setState({
      design: initialDesign,
      disabled,
      history: [initialDesign],
      historyIndex: 0,
      selectedElements: [],
      zoom: 1,
      pan: { x: 0, y: 0 },
      mode: "edit",
    });
  }, [designId]);

  return (
    <EditorLayout
      allowGrouping
      embedded
      appId={appId}
      designId={designId}
      disabled={disabled}
    />
  );
}

export function useIsValidDesign(): boolean {
  return useEditorStore(
    (state) => designSchema.safeParse(state.design).success ?? false,
  );
}

/**
 * Returns the current design from the editor store. Call this when submitting
 * the design form to get the latest design value.
 */
export function getDesignFromStore(): Design {
  return useEditorStore.getState().design;
}
