import type { JSX } from "react";
import type { BlockFilterRule } from "./types";
/**
 * Descriptor for a fixed drop-in region on a parent block (table cell, hero title, …).
 * Slots are not registry block types: the parent renders the shell (`td`, `motion.div`, …)
 * via `EditorEmbeddedSlot`, stores `style` + `children` on props, and excludes the shell
 * from move/clone/delete in the blocks panel.
 */
export type EmbeddedSlotDescriptor = {
  slotKey: string;
  childrenProperty: string;
  styleProperty: string;
  allow?: BlockFilterRule;
  maxChildren?: number;
  element?: keyof JSX.IntrinsicElements;
};

/** Embedded slot stored on parent block props (not a document block type). */
export type EmbeddedSlotData = {
  id: string;
  style: Record<string, unknown>;
  children: unknown[];
};

export type SelectedSlotRef = {
  blockId: string;
  slotKey: string;
  /** Document path to children array, e.g. `props.cells.2.children` */
  childrenProperty: string;
  /** Document path to slot style, e.g. `props.cells.2.style` */
  styleProperty: string;
};

export function isEmbeddedSlot(value: unknown): value is EmbeddedSlotData {
  return (
    isSlotLikeObject(value) &&
    typeof (value as EmbeddedSlotData).id === "string" &&
    (value as EmbeddedSlotData).id.length > 0
  );
}

export function isEditorBlockLike(
  value: unknown,
): value is { id: string; type: string } {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as { id?: unknown }).id === "string" &&
    typeof (value as { type?: unknown }).type === "string" &&
    (value as { type: string }).type.length > 0
  );
}

/** Embedded slot or legacy marketing slot `{ children }` under a named prop. */
export function isSlotLikeObject(value: unknown): value is {
  id?: string;
  style?: Record<string, unknown>;
  children: unknown[];
} {
  return (
    !!value &&
    typeof value === "object" &&
    Array.isArray((value as { children?: unknown }).children) &&
    !isEditorBlockLike(value)
  );
}

/** `data` + prop `props` → the root props bag, not a named embedded slot. */
export function isBlockRootPropsKey(
  currentPath: string,
  prop: string,
): boolean {
  return (
    prop === "props" &&
    (currentPath === "data" || currentPath.endsWith(".data"))
  );
}

/** `props.cells.3.children` → `props.cells.3.style` */
export function childrenPropertyToStyleProperty(
  childrenProperty: string,
): string {
  if (childrenProperty.endsWith(".children")) {
    return `${childrenProperty.slice(0, -".children".length)}.style`;
  }

  return `${childrenProperty}.style`;
}

/** `props.cells.3.children` → slotKey `cells.3` */
export function childrenPropertyToSlotKey(childrenProperty: string): string {
  const prefix = "props.";
  const suffix = ".children";
  let key = childrenProperty;
  if (key.startsWith(prefix)) key = key.slice(prefix.length);
  if (key.endsWith(suffix)) key = key.slice(0, -suffix.length);
  return key;
}
