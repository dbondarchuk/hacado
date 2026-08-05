import type { TEditorBlock } from "@hacado/builder";
import {
  EmbeddedSlotData,
  generateId,
  isEditorBlockLike,
  isEmbeddedSlot,
} from "@hacado/builder";
import type { ZodType } from "zod";
import * as z from "zod";

export type { EmbeddedSlotData };

export function embeddedSlotSchema(zStyles: ZodType) {
  return z.object({
    id: z.string(),
    style: zStyles,
    children: z.array(z.any()),
  });
}

export function createEmptySlot(
  defaultStyles: Record<string, unknown> = {},
  children: unknown[] = [],
): EmbeddedSlotData {
  return {
    id: generateId(),
    style: defaultStyles,
    children,
  };
}

export function migrateContainerSlot(
  container: TEditorBlock,
): EmbeddedSlotData {
  const data = container.data ?? {};
  const props = (data as { props?: { children?: unknown[] } }).props;
  const style = ((data as { style?: Record<string, unknown> }).style ??
    {}) as Record<string, unknown>;
  return {
    id: container.id ?? generateId(),
    style: { ...style },
    children: [...(props?.children ?? [])],
  };
}

/** Migrates legacy `{ children }` slots and optional single Container wrapper. */
export function migrateSlotValue(raw: unknown): EmbeddedSlotData {
  if (isEmbeddedSlot(raw)) return raw;
  if (raw && typeof raw === "object" && "children" in raw) {
    const slot = raw as {
      id?: string;
      style?: Record<string, unknown>;
      children?: unknown[];
    };
    const children = slot.children ?? [];
    if (
      children.length === 1 &&
      isEditorBlockLike(children[0]) &&
      children[0].type === "Container"
    ) {
      return migrateContainerSlot(children[0] as TEditorBlock);
    }
    return {
      id: slot.id ?? generateId(),
      style: { ...(slot.style ?? {}) },
      children: [...children],
    };
  }
  return createEmptySlot();
}

export function migratePropsSlots(
  props: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> {
  const next = { ...props };
  for (const key of keys) {
    if (key in next) next[key] = migrateSlotValue(next[key]);
  }
  return next;
}
