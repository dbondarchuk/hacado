import React, { memo, useMemo } from "react";
import { templateProps } from "../helpers/template-props";
import {
  useBlock,
  useBlocks,
  useEditorArgs,
  useRootBlockType,
} from "./context";

export const templatePropsFromContext = (props: any) => {
  const args = useEditorArgs();
  return templateProps(props, args);
};

export const CoreEditorBlock: React.FC<{
  blockId: string;
  additionalProps?: Record<string, any>;
  index: number;
  parentBlockId: string;
  parentProperty: string;
}> = memo(
  ({ blockId, additionalProps, index, parentBlockId, parentProperty }) => {
    const blocks = useBlocks();
    const rootBlockType = useRootBlockType();
    const block = useBlock(blockId)!;

    const Component = useMemo(
      () => blocks[block.type]?.Editor,
      [blocks, block.type],
    );

    if (rootBlockType === block.type) return <Component {...block.data} />;
    if (!Component) return null;

    return <Component {...block.data} base={block.base} {...additionalProps} />;
  },
);
