import * as z from "zod";

import { resolve } from "@hacado/utils";
import { TEditorBlock, TEditorConfiguration } from "../editor/core";
import { isSlotLikeObject } from "../embedded-slot";
import { BuilderSchema } from "../types";
import { generateId } from "./block-id";
import { coerceArray } from "./coerce-array";

const findChildrenProps = (
  obj: any,
  parentProps: string[],
): { children: any; property: string }[] => {
  if (!obj || typeof obj !== "object") return [];
  const result: { children: any; property: string }[] = [];
  for (const prop of Object.keys(obj)) {
    if (prop === "children" && Array.isArray(obj[prop]))
      result.push({ children: obj[prop], property: parentProps.join(".") });
    else if (prop === "cellBlocks" && Array.isArray(obj[prop]))
      result.push({
        children: obj[prop],
        property: [...parentProps, prop].join("."),
      });
    else if (prop === "cells") {
      coerceArray<unknown>(obj[prop]).forEach(
        (item: unknown, index: number) => {
          if (isSlotLikeObject(item)) {
            result.push({
              children: item.children,
              property: [...parentProps, prop, String(index), "children"].join(
                ".",
              ),
            });
          }
        },
      );
    } else if (
      isSlotLikeObject(obj[prop]) &&
      !(prop === "props" && parentProps.length === 0)
    ) {
      result.push({
        children: (obj[prop] as { children: unknown[] }).children,
        property: [...parentProps, prop, "children"].join("."),
      });
    } else result.push(...findChildrenProps(obj[prop], [...parentProps, prop]));
  }

  return result;
};

const findChildrenProp = (obj: any): any[] => {
  if (!obj || typeof obj !== "object") return [];
  const result = [];
  for (const prop of Object.keys(obj)) {
    if (prop === "children" && Array.isArray(obj[prop])) result.push(obj);
    else if (prop === "cellBlocks" && Array.isArray(obj[prop]))
      result.push({ children: obj[prop] });
    else result.push(...findChildrenProp(obj[prop]));
  }

  return result;
};

export const deleteBlockInLevel = (
  block: TEditorBlock,
  blockId: string,
  property?: string,
) => {
  const childrenProps = findChildrenProps(block.data, []);
  let toRemove = -1;
  for (const prop of childrenProps) {
    for (let i = 0; i < prop.children.length; i++) {
      const child = prop.children[i] as TEditorBlock;
      if (child?.id === blockId && (!property || prop.property === property)) {
        toRemove = i;
        break;
      }
    }

    if (toRemove >= 0) {
      const result = (prop.children as any[]).splice(toRemove, 1);
      return {
        block: result[0] as TEditorBlock,
        property: prop.property,
        index: toRemove,
        previousBlockId: prop.children[toRemove - 1]?.id ?? null,
      };
    }
  }

  return null;
};

export const insertBlockInLevel = (
  block: TEditorBlock,
  newBlock: TEditorBlock,
  property: string | undefined | null,
  index: number | "last",
) => {
  const resolved =
    property !== undefined && property !== null && property !== ""
      ? resolve(block, property, true) ||
        resolve(block, `data.${property}`, true)
      : findChildrenProp(block)[0];
  if (!resolved) return;

  if (Array.isArray(resolved)) {
    if (index === "last" || index >= resolved.length) {
      resolved.push(newBlock);
    } else {
      resolved.splice(index, 0, newBlock);
    }
    return;
  }

  if (!resolved.children) resolved.children = [];
  if (index === "last" || index >= (resolved.children as any[]).length) {
    (resolved.children as any[]).push(newBlock);
  } else {
    (resolved.children as any[]).splice(index, 0, newBlock);
  }
};

export const moveBlockInLevel = (
  block: TEditorBlock,
  blockId: string,
  dir: "up" | "down",
) => {
  const childrenProps = findChildrenProp(block.data);
  let index = -1;
  for (const prop of childrenProps) {
    for (let i = 0; i < prop.children.length; i++) {
      const child = prop.children[i] as TEditorBlock;
      if (child?.id === blockId) {
        index = i;
        break;
      }
    }

    if (index >= 0) {
      const value = prop.children[index];
      if (dir == "up" && index > 0) {
        const a = prop.children[index - 1];
        prop.children[index - 1] = value;
        prop.children[index] = a;
      } else if (dir == "down" && index < prop.children.length - 1) {
        const a = prop.children[index + 1];
        prop.children[index + 1] = value;
        prop.children[index] = a;
      }
      break;
    }
  }
};

export const swapBlockInLevel = (
  block: TEditorBlock,
  blockId1: string,
  blockId2: string,
) => {
  const childrenProps = findChildrenProp(block.data);
  let index1 = -1;
  let index2 = -1;
  for (const prop of childrenProps) {
    for (let i = 0; i < prop.children.length; i++) {
      const child = prop.children[i] as TEditorBlock;
      if (child?.id === blockId1) {
        index1 = i;
      }

      if (child?.id === blockId2) {
        index2 = i;
      }

      if (index1 >= 0 && index2 >= 0) break;
    }

    if (index1 >= 0 && index2 >= 0) {
      const value = prop.children[index1];
      prop.children[index1] = prop.children[index2];
      prop.children[index2] = value;

      break;
    }
  }
};

export const moveBlockToIndexInLevel = (
  block: TEditorBlock,
  blockId: string,
  newIndex: number | "last",
) => {
  const childrenProps = findChildrenProp(block.data);
  let index = -1;
  for (const prop of childrenProps) {
    for (let i = 0; i < prop.children.length; i++) {
      const child = prop.children[i] as TEditorBlock;
      if (child?.id === blockId) {
        index = i;
        break;
      }
    }

    if (index >= 0 && index !== newIndex) {
      const value = prop.children[index];
      const newIndexValue =
        newIndex === "last" ? prop.children.length : newIndex;
      const toIndex = newIndexValue > index ? newIndexValue - 1 : newIndexValue;
      prop.children.splice(index, 1);

      if (toIndex >= (prop.children as any[]).length) {
        (prop.children as any[]).push(value);
      } else {
        (prop.children as any[]).splice(toIndex, 0, value);
      }

      break;
    }
  }
};

const regenerateIds = (block: any) => {
  if (!block || typeof block !== "object") return;
  if ("id" in block && "type" in block && "data" in block)
    block.id = generateId();
  for (const value of Object.values(block)) {
    regenerateIds(value);
  }
};

export const regenerateBlockIds = (block: TEditorBlock) => {
  regenerateIds(block);
  return block;
};

export const cloneBlock = (block: TEditorBlock, seed?: string) => {
  const newBlock = JSON.parse(JSON.stringify(block)) as TEditorBlock;
  regenerateIds(newBlock);

  return newBlock;
};

export const cloneBlockInLevel = (block: TEditorBlock, blockId: string) => {
  const childrenProps = findChildrenProp(block.data);
  let index = -1;
  for (const prop of childrenProps) {
    for (let i = 0; i < prop.children.length; i++) {
      const child = prop.children[i] as TEditorBlock;
      if (child.id === blockId) {
        index = i;
        break;
      }
    }

    if (index >= 0) {
      const value = prop.children[index];
      const newBlock = cloneBlock(value, blockId);
      (prop.children as any[]).splice(index + 1, 0, newBlock);

      return newBlock;
    }
  }
};

const recursiveFindBlock = (
  block: TEditorBlock,
  blockId: string,
): TEditorBlock | null => {
  if (block.id === blockId) return block;

  const childrenProps = findChildrenProps(block.data, []).flatMap(
    (x) => x.children,
  );

  for (const child of childrenProps || []) {
    if (!child || !("id" in child)) continue;
    const result = recursiveFindBlock(child, blockId);
    if (result) return result;
  }

  return null;
};

const recursiveFindPreviousBlockId = (
  block: TEditorBlock,
  blockId: string,
  previousBlockId: string | null,
): string | null => {
  if (block.id === blockId) return previousBlockId;

  const childrenProps = findChildrenProps(block.data, []).flatMap(
    (x) => x.children,
  );

  let currentPreviousBlockId = previousBlockId;

  for (const child of childrenProps || []) {
    if (!child || !("id" in child)) continue;
    const result = recursiveFindPreviousBlockId(
      child,
      blockId,
      currentPreviousBlockId,
    );
    if (result) return currentPreviousBlockId;
    currentPreviousBlockId = child.id;
  }

  return null;
};

const recursiveValidateBlocks = (
  block: TEditorBlock,
  schemas: BuilderSchema,
): Record<
  string,
  {
    type: string;
    error: z.ZodError;
  }
> => {
  let results: Record<
    string,
    {
      type: string;
      error: z.ZodError;
    }
  > = {};

  if (!block || !schemas[block?.type]) return results;

  const parseResult = schemas[block.type].safeParse(block.data);
  if (!parseResult.success) {
    results[block.id] = {
      error: parseResult.error,
      type: block.type,
    };
  }

  const childrenProps = findChildrenProps(block.data, []).flatMap(
    (x) => x.children,
  );

  for (const child of childrenProps || []) {
    if (!child || !("id" in child)) continue;

    const result = recursiveValidateBlocks(child, schemas);
    results = { ...results, ...result };
  }

  return results;
};

const recursiveFindBlockHierarchy = (
  block: TEditorBlock,
  blockId: string,
): TEditorBlock[] | null => {
  if (block.id === blockId) return [block];

  const childrenProps = findChildrenProps(block.data, []).flatMap(
    (x) => x.children,
  );
  for (const child of childrenProps || []) {
    if (!child || !("id" in child)) continue;
    const result = recursiveFindBlockHierarchy(child, blockId);
    if (result) return [block, ...result];
  }

  return null;
};

const recursiveFindParentBlock = (
  block: TEditorBlock,
  blockId: string,
  parent: TEditorBlock,
  parentProperty: string,
  index = 0,
): { block: TEditorBlock; property: string; index: number } | null => {
  if (block.id === blockId)
    return {
      block: parent,
      property: parentProperty,
      index,
    };

  const childrenProps = findChildrenProps(block.data, []);
  for (const { children, property } of childrenProps || []) {
    let index = 0;
    for (const child of children || []) {
      if (!child || !("id" in child)) continue;
      const result = recursiveFindParentBlock(
        child,
        blockId,
        block,
        property,
        index,
      );
      if (result) return result;
      index++;
    }
  }

  return null;
};

export const findBlock = (document: TEditorConfiguration, blockId: string) => {
  return recursiveFindBlock(document, blockId);
};

export const findPreviousBlockId = (
  document: TEditorConfiguration,
  blockId: string,
) => {
  return recursiveFindPreviousBlockId(document, blockId, null);
};

export const validateBlocks = (
  document: TEditorConfiguration,
  schemas: BuilderSchema,
) => {
  return recursiveValidateBlocks(document, schemas);
};

export const findBlockHierarchy = (
  document: TEditorConfiguration,
  blockId: string,
) => {
  return recursiveFindBlockHierarchy(document, blockId);
};

export const findParentBlock = (
  document: TEditorConfiguration,
  blockId: string,
) => {
  return recursiveFindParentBlock(document, blockId, document, "");
};

/** Move block to grandparent level, inserted immediately after its current parent. */
export function getMoveBlockOutTarget(
  document: TEditorConfiguration,
  blockId: string,
): {
  parentBlockId: string;
  parentBlockProperty?: string;
  index: number;
} | null {
  const parent = findParentBlock(document, blockId);
  if (!parent) return null;

  const parentInGrandparent = findParentBlock(document, parent.block.id);
  if (!parentInGrandparent?.block.id) return null;

  // Parent is already the document root - nowhere to lift to.
  if (parent.block.id === document.id) return null;

  return {
    parentBlockId: parentInGrandparent.block.id,
    parentBlockProperty: parentInGrandparent.property || undefined,
    index: parentInGrandparent.index + 1,
  };
}
