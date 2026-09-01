"use client";

import {
  createContext,
  memo,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

import { BlockFilterRuleResult } from "../types";
import {
  useBlock,
  useSetAllowedRule,
  useSetBlockDisableOptions,
} from "./context";
import { BlockDisableOptions, TEditorBlock } from "./core";
import { CoreEditorBlock } from "./core.block";

const EditorBlockContext = createContext<{
  blockId: string;
  isOverlay: boolean;
  allow?: BlockFilterRuleResult;
  disable: BlockDisableOptions;
}>({
  blockId: "",
  isOverlay: false,
  allow: undefined,
  disable: {
    move: false,
    delete: false,
    clone: false,
    drag: false,
    resize: false,
  },
});

export const useCurrentBlockId = () => useContext(EditorBlockContext).blockId;
export const useIsCurrentBlockOverlay = () =>
  useContext(EditorBlockContext).isOverlay;
export const useCurrentBlockAllow = () => useContext(EditorBlockContext).allow;
export const useCurrentBlockDisableOptions = () =>
  useContext(EditorBlockContext).disable;

export const useCurrentBlock = <T,>() => {
  // return useBlock(useCurrentBlockId()) as TEditorBlock<T>;

  const currentBlockId = useCurrentBlockId();
  const block = useBlock(currentBlockId);

  return block! as TEditorBlock<T>;
};

type EditorBlockProps = {
  blockId: string;
  isOverlay?: boolean;
  disableMove?: boolean;
  disableDelete?: boolean;
  disableClone?: boolean;
  disableDrag?: boolean;
  disableResize?: boolean;
  disableOverlay?: boolean;
  disableNavMenu?: boolean;
  additionalProps?: Record<string, any>;
  index: number;
  parentBlockId: string;
  parentProperty: string;
  allow?: BlockFilterRuleResult;
};

export const EditorBlock = memo(
  ({
    blockId,
    isOverlay,
    disableMove,
    disableDelete,
    disableClone,
    disableDrag,
    disableResize,
    disableOverlay,
    disableNavMenu,
    additionalProps,
    index,
    parentBlockId,
    parentProperty,
    allow,
  }: EditorBlockProps) => {
    const setBlockDisableOptions = useSetBlockDisableOptions();
    const setAllowedRule = useSetAllowedRule();
    const isCurrentOverlay = useIsCurrentBlockOverlay();
    const ref = useRef<HTMLElement>(null);

    const isOvelayBlock = !!isOverlay || !!isCurrentOverlay;

    const disable = useMemo(() => {
      return {
        move: disableMove,
        delete: disableDelete,
        clone: disableClone,
        drag: disableDrag,
        resize: disableResize,
        overlay: disableOverlay,
        navMenu: disableNavMenu,
      };
    }, [
      disableMove,
      disableDelete,
      disableClone,
      disableDrag,
      disableResize,
      disableOverlay,
      disableNavMenu,
    ]);

    useEffect(() => {
      if (isOvelayBlock) return;
      setBlockDisableOptions(blockId, disable);
    }, [blockId, disable, setBlockDisableOptions]);

    useEffect(() => {
      if (isOvelayBlock || !allow) return;
      setAllowedRule(parentBlockId, parentProperty, allow);
    }, [allow, isOvelayBlock, parentBlockId, parentProperty, setAllowedRule]);

    const blockContext = useMemo(
      () => ({
        blockId,
        isOverlay: isOvelayBlock,
        disable,
        allow,
        ref,
      }),
      [blockId, isOvelayBlock, allow, disable],
    );

    return (
      <EditorBlockContext.Provider value={blockContext}>
        <CoreEditorBlock
          blockId={blockId}
          additionalProps={additionalProps}
          index={index}
          parentBlockId={parentBlockId}
          parentProperty={parentProperty}
        />
      </EditorBlockContext.Provider>
    );
  },
);
